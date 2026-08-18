package com.skkil.sync.post.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.skkil.sync.post.constants.PostConstants;
import com.skkil.sync.post.dto.request.CreatePostRequest;
import com.skkil.sync.post.dto.request.PostContentRequest;
import com.skkil.sync.post.dto.request.UpdatePostRequest;
import com.skkil.sync.post.dto.request.UpdateProjectPostRequest;
import com.skkil.sync.post.dto.response.CreatePostResponse;
import com.skkil.sync.post.exception.InvalidPostPublishRequestException;
import com.skkil.sync.post.exception.PostNotFoundException;
import com.skkil.sync.post.exception.PostPinLimitExceededException;
import com.skkil.sync.post.model.Post;
import com.skkil.sync.post.model.PostStatus;
import com.skkil.sync.post.model.PostType;
import com.skkil.sync.post.repository.PostRecruitmentRepository;
import com.skkil.sync.post.repository.PostRepository;
import com.skkil.sync.post.snippets.UpdatePostRequestSnippets;
import com.skkil.sync.post.snippets.UpdateProjectPostRequestSnippets;
import com.skkil.sync.project.model.Project;
import com.skkil.sync.project.service.ProjectDomainService;
import com.skkil.sync.user.model.User;
import com.skkil.sync.user.service.domain.UserDomainService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PostServiceTests {

  @Mock private UserDomainService userDomainService;

  @Mock private ProjectDomainService projectDomainService;

  @Mock private PostContentMediaService contentMediaService;

  @Mock private TagService tagService;

  @Mock private PostReferenceService postReferenceService;

  @Mock private PostRepository postRepository;

  @Mock private PostRecruitmentRepository postRecruitmentRepository;

  @InjectMocks private PostService postService;

  @Test
  @DisplayName("[createPost] 작성자 handle이 없어도 제목 없는 초안 slug에 null을 사용하지 않음")
  void createPost_untitledDraftWithoutAuthorHandle_usesFallbackSlugPrefix() {
    Long authorId = 1L;
    User author = new User(authorId);
    CreatePostRequest request = createPostRequest(PostType.LONG, "", PostStatus.DRAFT, List.of());

    when(userDomainService.getUserReference(authorId)).thenReturn(author);
    when(contentMediaService.resolveMediaFilesForCreate(authorId, List.of())).thenReturn(List.of());
    when(postRepository.save(any(Post.class))).thenAnswer(invocation -> invocation.getArgument(0));

    CreatePostResponse response = postService.createPost(authorId, request);

    assertThat(response.slug()).startsWith("user-1-");
    verify(tagService).addTagsToPost(any(Post.class), any(), any(), any());
    verify(postReferenceService).replaceReferences(any(Post.class), any());
  }

  @Test
  @DisplayName("[updatePost] 발행된 글은 초안으로 되돌릴 수 없음")
  void updatePost_publishedToDraft_throwsException() {
    Long postId = 1L;
    Post post =
        Post.builder()
            .slug("published-post")
            .title("제목")
            .jsonContent("{\"text\":\"content\"}")
            .type(PostType.LONG)
            .status(PostStatus.PUBLISHED)
            .build();
    UpdatePostRequest request =
        new UpdatePostRequest(
            "제목",
            PostType.LONG,
            PostStatus.DRAFT,
            new PostContentRequest("content", "{\"text\":\"content\"}", List.of()),
            List.of(),
            List.of(),
            null,
            null);

    when(postRepository.findById(postId)).thenReturn(Optional.of(post));

    assertThatThrownBy(() -> postService.updatePost(postId, request))
        .isInstanceOf(InvalidPostPublishRequestException.class);
    assertThat(post.getStatus()).isEqualTo(PostStatus.PUBLISHED);
  }

  @Test
  @DisplayName("[updatePost] 존재하지 않는 회고를 수정하려는 경우 PostNotFoundException 예외 발생")
  void updatePost_postNotFound_throwsException() {
    Long postId = 1L;
    UpdatePostRequest request = UpdatePostRequestSnippets.getUpdatePostRequest();

    when(postRepository.findById(postId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> postService.updatePost(postId, request))
        .isInstanceOf(PostNotFoundException.class);
  }

  @Test
  @DisplayName("[updatePost] 구인글을 일반 글 API로 수정하려는 경우 예외 발생")
  void updatePost_recruitmentPost_throwsException() {
    Long postId = 1L;
    UpdatePostRequest request = UpdatePostRequestSnippets.getUpdatePostRequest();

    when(postRecruitmentRepository.existsById(postId)).thenReturn(true);

    assertThatThrownBy(() -> postService.updatePost(postId, request))
        .isInstanceOf(InvalidPostPublishRequestException.class);
    verify(postRepository, never()).findById(any());
  }

  @Test
  @DisplayName("[updatePost] 프로젝트 글을 전역 글 수정 API로 수정하려는 경우 PostNotFoundException 예외 발생")
  void updatePost_postBelongsToProject_throwsException() {
    Long postId = 1L;
    Project project = Project.builder().handle("project-handle").name("Project").build();
    project.setId(1L);
    Post post =
        Post.builder()
            .slug("project-post")
            .title("제목")
            .jsonContent("{\"text\":\"content\"}")
            .type(PostType.LONG)
            .status(PostStatus.PUBLISHED)
            .project(project)
            .build();
    UpdatePostRequest request = UpdatePostRequestSnippets.getUpdatePostRequest();

    when(postRepository.findById(postId)).thenReturn(Optional.of(post));

    assertThatThrownBy(() -> postService.updatePost(postId, request))
        .isInstanceOf(PostNotFoundException.class);
  }

  @Test
  @DisplayName("[updateProjectPost] 다른 프로젝트의 handle로 수정하려는 경우 PostNotFoundException 예외 발생")
  void updateProjectPost_handleMismatch_throwsException() {
    Long postId = 1L;
    String handle = "other-project";
    Project postProject = Project.builder().handle("post-project").name("Post Project").build();
    postProject.setId(1L);
    Project requestedProject = Project.builder().handle(handle).name("Other Project").build();
    requestedProject.setId(2L);
    Post post =
        Post.builder()
            .slug("project-post")
            .title("제목")
            .jsonContent("{\"text\":\"content\"}")
            .type(PostType.LONG)
            .status(PostStatus.PUBLISHED)
            .project(postProject)
            .build();
    UpdateProjectPostRequest request =
        UpdateProjectPostRequestSnippets.getUpdateProjectPostRequest();

    when(postRepository.findById(postId)).thenReturn(Optional.of(post));
    when(projectDomainService.getProjectByHandle(handle)).thenReturn(requestedProject);

    assertThatThrownBy(() -> postService.updateProjectPost(postId, handle, request))
        .isInstanceOf(PostNotFoundException.class);
  }

  @Test
  @DisplayName(
      "[updateProjectPost] 프로젝트에 속하지 않은 글을 프로젝트 글 API로 수정하려는 경우 PostNotFoundException 예외 발생")
  void updateProjectPost_postWithoutProject_throwsException() {
    Long postId = 1L;
    String handle = "project-handle";
    Project requestedProject = Project.builder().handle(handle).name("Project").build();
    requestedProject.setId(1L);
    Post post =
        Post.builder()
            .slug("post")
            .title("제목")
            .jsonContent("{\"text\":\"content\"}")
            .type(PostType.LONG)
            .status(PostStatus.PUBLISHED)
            .build();
    UpdateProjectPostRequest request =
        UpdateProjectPostRequestSnippets.getUpdateProjectPostRequest();

    when(postRepository.findById(postId)).thenReturn(Optional.of(post));
    when(projectDomainService.getProjectByHandle(handle)).thenReturn(requestedProject);

    assertThatThrownBy(() -> postService.updateProjectPost(postId, handle, request))
        .isInstanceOf(PostNotFoundException.class);
  }

  @Test
  @DisplayName("[pinPost] 다른 프로젝트의 글을 고정하려는 경우 PostNotFoundException 예외 발생")
  void pinPost_postBelongsToOtherProject_throwsException() {
    Long postId = 1L;
    String handle = "project-handle";
    Project postProject = Project.builder().handle("other-project").name("Other").build();
    postProject.setId(1L);
    Project requestedProject = Project.builder().handle(handle).name("Project").build();
    requestedProject.setId(2L);
    Post post =
        Post.builder()
            .slug("project-post")
            .title("제목")
            .jsonContent("{\"text\":\"content\"}")
            .type(PostType.LONG)
            .status(PostStatus.PUBLISHED)
            .project(postProject)
            .build();

    when(postRepository.findById(postId)).thenReturn(Optional.of(post));
    when(projectDomainService.getProjectByHandle(handle)).thenReturn(requestedProject);

    assertThatThrownBy(() -> postService.pinPost(postId, handle))
        .isInstanceOf(PostNotFoundException.class);
  }

  @Test
  @DisplayName("[pinPost] 프로젝트에 이미 최대 개수만큼 고정된 게시글이 있으면 PostPinLimitExceededException 예외 발생")
  void pinPost_pinLimitReached_throwsException() {
    Long postId = 1L;
    String handle = "project-handle";
    Project project = Project.builder().handle(handle).name("Project").build();
    project.setId(1L);
    Post post =
        Post.builder()
            .slug("project-post")
            .title("제목")
            .jsonContent("{\"text\":\"content\"}")
            .type(PostType.LONG)
            .status(PostStatus.PUBLISHED)
            .project(project)
            .build();

    when(postRepository.findById(postId)).thenReturn(Optional.of(post));
    when(projectDomainService.getProjectByHandle(handle)).thenReturn(project);
    when(postRepository.countByProjectAndPinnedAtIsNotNull(project))
        .thenReturn((long) PostConstants.MAX_PINNED_POSTS_PER_PROJECT);

    assertThatThrownBy(() -> postService.pinPost(postId, handle))
        .isInstanceOf(PostPinLimitExceededException.class);
    assertThat(post.isPinned()).isFalse();
  }

  @Test
  @DisplayName("[pinPost] 이미 고정된 게시글을 다시 고정하면 한도 검사 없이 그대로 유지")
  void pinPost_alreadyPinned_isIdempotent() {
    Long postId = 1L;
    String handle = "project-handle";
    Project project = Project.builder().handle(handle).name("Project").build();
    project.setId(1L);
    Post post =
        Post.builder()
            .slug("project-post")
            .title("제목")
            .jsonContent("{\"text\":\"content\"}")
            .type(PostType.LONG)
            .status(PostStatus.PUBLISHED)
            .project(project)
            .build();
    post.pin();

    when(postRepository.findById(postId)).thenReturn(Optional.of(post));
    when(projectDomainService.getProjectByHandle(handle)).thenReturn(project);

    postService.pinPost(postId, handle);

    assertThat(post.isPinned()).isTrue();
    verify(postRepository, never()).countByProjectAndPinnedAtIsNotNull(any());
  }

  @Test
  @DisplayName("[unpinPost] 고정된 게시글의 고정을 해제")
  void unpinPost_pinnedPost_unpinsIt() {
    Long postId = 1L;
    String handle = "project-handle";
    Project project = Project.builder().handle(handle).name("Project").build();
    project.setId(1L);
    Post post =
        Post.builder()
            .slug("project-post")
            .title("제목")
            .jsonContent("{\"text\":\"content\"}")
            .type(PostType.LONG)
            .status(PostStatus.PUBLISHED)
            .project(project)
            .build();
    post.pin();

    when(postRepository.findById(postId)).thenReturn(Optional.of(post));
    when(projectDomainService.getProjectByHandle(handle)).thenReturn(project);

    postService.unpinPost(postId, handle);

    assertThat(post.isPinned()).isFalse();
  }

  @Test
  @DisplayName("[deletePost] 존재하지 않는 회고를 삭제하려는 경우 PostNotFoundException 예외 발생")
  void deletePost_postNotFound_throwsException() {
    Long postId = 1L;

    when(postRepository.existsById(postId)).thenReturn(false);

    assertThatThrownBy(() -> postService.deletePost(postId))
        .isInstanceOf(PostNotFoundException.class);
  }

  private static CreatePostRequest createPostRequest(
      PostType type, String title, PostStatus status, List<String> tags) {
    return CreatePostRequest.builder()
        .title(title)
        .type(type)
        .status(status)
        .content(new PostContentRequest("content", "{\"text\":\"content\"}", List.of()))
        .tags(tags)
        .build();
  }
}
