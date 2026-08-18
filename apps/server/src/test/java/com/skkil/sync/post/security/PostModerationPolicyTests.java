package com.skkil.sync.post.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.skkil.sync.post.dto.data.PostDto;
import com.skkil.sync.post.model.PostStatus;
import com.skkil.sync.post.model.PostType;
import com.skkil.sync.project.model.Project;
import com.skkil.sync.project.model.Teammate;
import com.skkil.sync.project.repository.TeammateRepository;
import com.skkil.sync.user.constant.Role;
import com.skkil.sync.user.model.User;
import com.skkil.sync.user.repository.UserRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PostModerationPolicyTests {

  private static final Long REQUESTER_ID = 1L;
  private static final Long AUTHOR_ID = 2L;
  private static final String PROJECT_HANDLE = "project-handle";

  @Mock private UserRepository userRepository;

  @Mock private TeammateRepository teammateRepository;

  @InjectMocks private PostModerationPolicy postModerationPolicy;

  @Test
  @DisplayName("[resolveDeletable] 비로그인 요청자는 어떤 게시글도 삭제할 수 없음")
  void resolveDeletable_anonymous_returnsFalse() {
    var result = postModerationPolicy.resolveDeletable(null, List.of(post(10L, AUTHOR_ID, null)));

    assertThat(result).containsEntry(10L, false);
  }

  @Test
  @DisplayName("[resolveDeletable] 작성자는 권한 조회 없이 삭제할 수 있음")
  void resolveDeletable_author_returnsTrue() {
    var result =
        postModerationPolicy.resolveDeletable(REQUESTER_ID, List.of(post(10L, REQUESTER_ID, null)));

    assertThat(result).containsEntry(10L, true);
  }

  @Test
  @DisplayName("[resolveDeletable] 플랫폼 관리자는 남의 개인 게시글을 삭제할 수 있음")
  void resolveDeletable_platformAdmin_personalPost_returnsTrue() {
    when(userRepository.findById(REQUESTER_ID)).thenReturn(Optional.of(user(Role.ADMIN)));

    var result =
        postModerationPolicy.resolveDeletable(REQUESTER_ID, List.of(post(10L, AUTHOR_ID, null)));

    assertThat(result).containsEntry(10L, true);
  }

  @Test
  @DisplayName("[resolveDeletable] 일반 사용자는 남의 개인 게시글을 삭제할 수 없음")
  void resolveDeletable_normalUser_personalPost_returnsFalse() {
    when(userRepository.findById(REQUESTER_ID)).thenReturn(Optional.of(user(Role.USER)));

    var result =
        postModerationPolicy.resolveDeletable(REQUESTER_ID, List.of(post(10L, AUTHOR_ID, null)));

    assertThat(result).containsEntry(10L, false);
  }

  @Test
  @DisplayName("[resolveDeletable] 프로젝트 관리자는 해당 프로젝트의 게시글을 삭제할 수 있음")
  void resolveDeletable_projectManager_projectPost_returnsTrue() {
    Project project = Project.builder().handle(PROJECT_HANDLE).name("Project").build();
    when(teammateRepository.findByUserIdAndProjectHandleIn(REQUESTER_ID, Set.of(PROJECT_HANDLE)))
        .thenReturn(List.of(Teammate.owner(project, user(Role.USER))));

    var result =
        postModerationPolicy.resolveDeletable(
            REQUESTER_ID, List.of(post(10L, AUTHOR_ID, PROJECT_HANDLE)));

    assertThat(result).containsEntry(10L, true);
  }

  @Test
  @DisplayName("[resolveDeletable] 프로젝트 일반 팀원은 프로젝트 게시글을 삭제할 수 없음")
  void resolveDeletable_projectMember_projectPost_returnsFalse() {
    Project project = Project.builder().handle(PROJECT_HANDLE).name("Project").build();
    when(teammateRepository.findByUserIdAndProjectHandleIn(REQUESTER_ID, Set.of(PROJECT_HANDLE)))
        .thenReturn(List.of(Teammate.member(project, user(Role.USER))));

    var result =
        postModerationPolicy.resolveDeletable(
            REQUESTER_ID, List.of(post(10L, AUTHOR_ID, PROJECT_HANDLE)));

    assertThat(result).containsEntry(10L, false);
  }

  @Test
  @DisplayName("[resolveDeletable] 개인 게시글이 없으면 플랫폼 관리자 여부를 조회하지 않음")
  void resolveDeletable_noForeignPersonalPost_skipsAdminLookup() {
    when(teammateRepository.findByUserIdAndProjectHandleIn(REQUESTER_ID, Set.of(PROJECT_HANDLE)))
        .thenReturn(List.of());

    var result =
        postModerationPolicy.resolveDeletable(
            REQUESTER_ID, List.of(post(10L, AUTHOR_ID, PROJECT_HANDLE)));

    assertThat(result).containsEntry(10L, false);
  }

  private static User user(Role role) {
    User user = new User(REQUESTER_ID);
    user.setRole(role);
    return user;
  }

  private static PostDto post(Long postId, Long authorId, String projectHandle) {
    OffsetDateTime now = OffsetDateTime.parse("2026-01-01T00:00:00Z");
    return new PostDto(
        postId,
        PostType.LONG,
        PostStatus.PUBLISHED,
        "post-slug-" + postId,
        "제목",
        authorId,
        projectHandle,
        null,
        null,
        null,
        null,
        null,
        null,
        "{\"type\":\"doc\"}",
        null,
        null,
        now,
        now,
        0L,
        0L,
        false,
        false,
        false,
        "미리보기 텍스트",
        0,
        0,
        null,
        false,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        now);
  }
}
