package com.skkil.sync.post.mapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.skkil.sync.media.dto.MediaDto;
import com.skkil.sync.media.service.domain.MediaDomainService;
import com.skkil.sync.post.dto.data.PostDto;
import com.skkil.sync.post.dto.response.GetPostResponse;
import com.skkil.sync.post.dto.summary.PostSummary;
import com.skkil.sync.post.model.PostStatus;
import com.skkil.sync.post.model.PostType;
import com.skkil.sync.post.security.PostAccessLevel;
import com.skkil.sync.post.security.PostAccessPolicy;
import com.skkil.sync.post.security.PostCommentPolicy;
import com.skkil.sync.post.security.PostModerationPolicy;
import com.skkil.sync.post.service.PostContentMediaService;
import com.skkil.sync.post.service.TagService;
import com.skkil.sync.user.dto.summary.UserSummary;
import com.skkil.sync.user.mapper.UserAssembler;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 유료 게이트({@link PostAccessLevel#PREVIEW})에서 본문이 실제로 응답에서 제거되는지 검증한다.
 *
 * <p>{@link PostAccessPolicy} 는 현재 항상 {@code FULL} 을 반환하는 수익화 OFF 스텁이므로, PREVIEW 경로는 정책을 목(mock)으로
 * 강제해 검증한다. Week 3 에 정책이 실제 유료 판정을 하게 되면 이 테스트는 그대로 회귀 방지망이 된다.
 */
@ExtendWith(MockitoExtension.class)
class PostAssemblerTests {

  private static final Long REQUESTER_ID = 10L;
  private static final Long POST_ID = 1L;
  private static final Long AUTHOR_ID = 2L;

  @Mock private PostMapper postMapper;
  @Mock private UserAssembler userAssembler;
  @Mock private TagService tagService;
  @Mock private PostContentMediaService postContentMediaService;
  @Mock private MediaDomainService mediaDomainService;
  @Mock private PostAccessPolicy postAccessPolicy;
  @Mock private PostModerationPolicy postModerationPolicy;
  @Mock private PostCommentPolicy postCommentPolicy;

  private PostAssembler postAssembler;

  @BeforeEach
  void setUpMaterializeCollaborators() {
    postAssembler =
        new PostAssembler(
            postMapper,
            userAssembler,
            tagService,
            postContentMediaService,
            mediaDomainService,
            postAccessPolicy,
            postModerationPolicy,
            postCommentPolicy);

    when(userAssembler.toUserSummaries(List.of(AUTHOR_ID)))
        .thenReturn(Map.of(AUTHOR_ID, UserSummary.builder().handle("author").name("작성자").build()));
    when(tagService.getTagsForPosts(REQUESTER_ID, List.of(POST_ID))).thenReturn(Map.of());
    when(postModerationPolicy.resolveDeletable(any(), any())).thenReturn(Map.of(POST_ID, false));
    when(postCommentPolicy.resolveCommentable(any(), any())).thenReturn(Map.of(POST_ID, true));

    // 목(mock) 매퍼가 전달받은 accessLevel/previewMedia 를 그대로 담은 요약을 돌려주도록 하여,
    // 어셈블러가 계산한 값이 응답까지 그대로 흘러가는지 확인할 수 있게 한다.
    when(postMapper.toPostSummary(
            any(),
            any(),
            any(),
            any(),
            anyBoolean(),
            anyBoolean(),
            anyBoolean(),
            any(),
            any(),
            any(),
            any()))
        .thenAnswer(
            invocation ->
                PostSummary.builder()
                    .id(invocation.<PostDto>getArgument(0).id())
                    .accessLevel(invocation.getArgument(1))
                    .author(invocation.getArgument(2))
                    .previewMedia(invocation.getArgument(8))
                    .build());
  }

  @Test
  @DisplayName("[toGetPostResponse] PREVIEW 게시글은 본문(content)을 응답에서 제외한다")
  void toGetPostResponse_preview_omitsContent() {
    PostDto post = post();
    when(postContentMediaService.getPreviewMediaForPosts(List.of(POST_ID))).thenReturn(Map.of());
    when(postAccessPolicy.resolveAccessLevels(REQUESTER_ID, List.of(post)))
        .thenReturn(Map.of(POST_ID, PostAccessLevel.PREVIEW));

    GetPostResponse response = postAssembler.toGetPostResponse(post, mediaFiles(), REQUESTER_ID);

    assertThat(response.summary().accessLevel()).isEqualTo(PostAccessLevel.PREVIEW);
    assertThat(response.content()).isNull();
    // 본문 매핑 자체가 일어나지 않아야 한다 — presigned URL 이 만들어졌다가 버려지는 것도 방지한다.
    verify(postMapper, never()).toContent(any(), any());
  }

  @Test
  @DisplayName("[toGetPostResponse] FULL 게시글은 본문(content)을 그대로 포함한다")
  void toGetPostResponse_full_includesContent() {
    PostDto post = post();
    List<MediaDto> media = mediaFiles();
    GetPostResponse.Content content =
        GetPostResponse.TiptapContent.builder().json("{\"type\":\"doc\"}").media(List.of()).build();

    when(postContentMediaService.getPreviewMediaForPosts(List.of(POST_ID))).thenReturn(Map.of());
    when(postAccessPolicy.resolveAccessLevels(REQUESTER_ID, List.of(post)))
        .thenReturn(Map.of(POST_ID, PostAccessLevel.FULL));
    when(postMapper.toContent(post, media)).thenReturn(content);

    GetPostResponse response = postAssembler.toGetPostResponse(post, media, REQUESTER_ID);

    assertThat(response.summary().accessLevel()).isEqualTo(PostAccessLevel.FULL);
    assertThat(response.content()).isEqualTo(content);
  }

  @Test
  @DisplayName("[toPostResponses] PREVIEW 게시글은 목록에서도 previewMedia 를 비운다")
  void toPostResponses_preview_stripsPreviewMedia() {
    PostDto post = post();
    when(postContentMediaService.getPreviewMediaForPosts(List.of(POST_ID)))
        .thenReturn(Map.of(POST_ID, mediaFiles()));
    when(postAccessPolicy.resolveAccessLevels(REQUESTER_ID, List.of(post)))
        .thenReturn(Map.of(POST_ID, PostAccessLevel.PREVIEW));

    List<PostSummary> summaries = postAssembler.toPostResponses(List.of(post), REQUESTER_ID);

    assertThat(summaries)
        .singleElement()
        .satisfies(
            summary -> {
              assertThat(summary.accessLevel()).isEqualTo(PostAccessLevel.PREVIEW);
              assertThat(summary.previewMedia()).isEmpty();
            });
    verify(postMapper, never()).toPreviewMedia(any());
  }

  @Test
  @DisplayName("[toPostResponses] FULL 게시글은 previewMedia 를 그대로 노출한다")
  void toPostResponses_full_keepsPreviewMedia() {
    PostDto post = post();
    List<GetPostResponse.Media> previewMedia =
        List.of(GetPostResponse.Media.builder().id(7L).url("https://example.com/1.png").build());

    when(postContentMediaService.getPreviewMediaForPosts(List.of(POST_ID)))
        .thenReturn(Map.of(POST_ID, mediaFiles()));
    when(postAccessPolicy.resolveAccessLevels(REQUESTER_ID, List.of(post)))
        .thenReturn(Map.of(POST_ID, PostAccessLevel.FULL));
    when(postMapper.toPreviewMedia(mediaFiles())).thenReturn(previewMedia);

    List<PostSummary> summaries = postAssembler.toPostResponses(List.of(post), REQUESTER_ID);

    assertThat(summaries)
        .singleElement()
        .satisfies(summary -> assertThat(summary.previewMedia()).isEqualTo(previewMedia));
  }

  private static List<MediaDto> mediaFiles() {
    return List.of(MediaDto.builder().id(7L).url("https://example.com/1.png").build());
  }

  private static PostDto post() {
    OffsetDateTime now = OffsetDateTime.parse("2026-01-01T00:00:00Z");
    return new PostDto(
        POST_ID,
        PostType.LONG,
        PostStatus.PUBLISHED,
        "post-slug",
        "제목",
        AUTHOR_ID,
        null,
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
        1,
        100,
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
