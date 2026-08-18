package com.skkil.sync.post.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.skkil.sync.post.dto.data.PostDto;
import com.skkil.sync.post.model.PostStatus;
import com.skkil.sync.post.model.PostType;
import com.skkil.sync.project.model.Project;
import com.skkil.sync.project.model.Teammate;
import com.skkil.sync.project.repository.TeammateRepository;
import com.skkil.sync.user.model.User;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PostCommentPolicyTests {

  private static final Long REQUESTER_ID = 1L;
  private static final Long AUTHOR_ID = 2L;
  private static final String PROJECT_HANDLE = "project-handle";

  @Mock private TeammateRepository teammateRepository;

  @InjectMocks private PostCommentPolicy postCommentPolicy;

  @Test
  @DisplayName("[canComment] 비로그인 요청자는 댓글을 작성할 수 없음")
  void canComment_anonymous_returnsFalse() {
    assertThat(postCommentPolicy.canComment(null, post(10L, null, PostStatus.PUBLISHED))).isFalse();

    verifyNoInteractions(teammateRepository);
  }

  @Test
  @DisplayName("[canComment] 로그인한 사용자는 남의 개인 게시글에 댓글을 작성할 수 있음")
  void canComment_personalPost_returnsTrue() {
    assertThat(postCommentPolicy.canComment(REQUESTER_ID, post(10L, null, PostStatus.PUBLISHED)))
        .isTrue();

    verifyNoInteractions(teammateRepository);
  }

  @Test
  @DisplayName("[canComment] 프로젝트 팀원은 프로젝트 게시글에 댓글을 작성할 수 있음")
  void canComment_projectPost_teammate_returnsTrue() {
    Project project = Project.builder().handle(PROJECT_HANDLE).name("Project").build();
    when(teammateRepository.findByUserIdAndProjectHandleIn(REQUESTER_ID, Set.of(PROJECT_HANDLE)))
        .thenReturn(List.of(Teammate.member(project, new User(REQUESTER_ID))));

    assertThat(
            postCommentPolicy.canComment(
                REQUESTER_ID, post(10L, PROJECT_HANDLE, PostStatus.PUBLISHED)))
        .isTrue();
  }

  @Test
  @DisplayName("[canComment] 팀원이 아니면 읽을 수 있는 공개 프로젝트 게시글이라도 댓글을 작성할 수 없음")
  void canComment_projectPost_nonTeammate_returnsFalse() {
    when(teammateRepository.findByUserIdAndProjectHandleIn(REQUESTER_ID, Set.of(PROJECT_HANDLE)))
        .thenReturn(List.of());

    assertThat(
            postCommentPolicy.canComment(
                REQUESTER_ID, post(10L, PROJECT_HANDLE, PostStatus.PUBLISHED)))
        .isFalse();
  }

  @Test
  @DisplayName("[canComment] 발행되지 않은 게시글에는 댓글을 작성할 수 없음")
  void canComment_draftPost_returnsFalse() {
    assertThat(postCommentPolicy.canComment(REQUESTER_ID, post(10L, null, PostStatus.DRAFT)))
        .isFalse();

    verifyNoInteractions(teammateRepository);
  }

  @Test
  @DisplayName("[resolveCommentable] 게시글별로 작성 가능 여부를 한 번의 조회로 판단함")
  void resolveCommentable_mixedPosts_resolvesEach() {
    Project project = Project.builder().handle(PROJECT_HANDLE).name("Project").build();
    when(teammateRepository.findByUserIdAndProjectHandleIn(REQUESTER_ID, Set.of(PROJECT_HANDLE)))
        .thenReturn(List.of(Teammate.member(project, new User(REQUESTER_ID))));

    var result =
        postCommentPolicy.resolveCommentable(
            REQUESTER_ID,
            List.of(
                post(10L, null, PostStatus.PUBLISHED),
                post(11L, PROJECT_HANDLE, PostStatus.PUBLISHED),
                post(12L, null, PostStatus.DRAFT)));

    assertThat(result).containsEntry(10L, true).containsEntry(11L, true).containsEntry(12L, false);
  }

  private static PostDto post(Long postId, String projectHandle, PostStatus status) {
    OffsetDateTime now = OffsetDateTime.parse("2026-01-01T00:00:00Z");
    return new PostDto(
        postId,
        PostType.LONG,
        status,
        "post-slug-" + postId,
        "제목",
        AUTHOR_ID,
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
