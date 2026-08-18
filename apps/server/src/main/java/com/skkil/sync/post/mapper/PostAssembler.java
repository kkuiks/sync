package com.skkil.sync.post.mapper;

import com.skkil.sync.common.util.pagination.dto.response.CursorPaginationResponse;
import com.skkil.sync.media.dto.MediaDto;
import com.skkil.sync.media.service.domain.MediaDomainService;
import com.skkil.sync.post.dto.data.PostDto;
import com.skkil.sync.post.dto.response.GetPostResponse;
import com.skkil.sync.post.dto.summary.PostRecruitmentSummary;
import com.skkil.sync.post.dto.summary.PostSummary;
import com.skkil.sync.post.security.PostAccessLevel;
import com.skkil.sync.post.security.PostAccessPolicy;
import com.skkil.sync.post.security.PostCommentPolicy;
import com.skkil.sync.post.security.PostModerationPolicy;
import com.skkil.sync.post.service.PostContentMediaService;
import com.skkil.sync.post.service.TagService;
import com.skkil.sync.user.mapper.UserAssembler;
import java.net.URL;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class PostAssembler {

  private final PostMapper postMapper;

  private final UserAssembler userAssembler;

  private final TagService tagService;

  private final PostContentMediaService postContentMediaService;

  private final MediaDomainService mediaDomainService;

  private final PostAccessPolicy postAccessPolicy;

  private final PostModerationPolicy postModerationPolicy;

  private final PostCommentPolicy postCommentPolicy;

  public PostAssembler(
      PostMapper postMapper,
      UserAssembler userAssembler,
      TagService tagService,
      PostContentMediaService postContentMediaService,
      MediaDomainService mediaDomainService,
      PostAccessPolicy postAccessPolicy,
      PostModerationPolicy postModerationPolicy,
      PostCommentPolicy postCommentPolicy) {
    this.postMapper = postMapper;
    this.userAssembler = userAssembler;
    this.tagService = tagService;
    this.postContentMediaService = postContentMediaService;
    this.mediaDomainService = mediaDomainService;
    this.postAccessPolicy = postAccessPolicy;
    this.postModerationPolicy = postModerationPolicy;
    this.postCommentPolicy = postCommentPolicy;
  }

  public GetPostResponse toGetPostResponse(PostDto post, List<MediaDto> media, Long requesterId) {
    var summary = materialize(List.of(post), requesterId).get(post.id());

    if (summary.accessLevel() == PostAccessLevel.PREVIEW) {
      return GetPostResponse.builder().summary(summary).build();
    }

    return GetPostResponse.builder()
        .summary(summary)
        .content(postMapper.toContent(post, media))
        .build();
  }

  public CursorPaginationResponse<PostSummary> toPostResponses(
      CursorPaginationResponse<PostDto> posts, Long requesterId) {
    var summaries =
        materialize(posts.nodes().stream().map(node -> node.content()).toList(), requesterId);
    return posts.map(post -> summaries.get(post.id()));
  }

  public List<PostSummary> toPostResponses(List<PostDto> posts, Long requesterId) {
    var summaries = materialize(posts, requesterId);
    return posts.stream().map(post -> summaries.get(post.id())).toList();
  }

  private Map<Long, PostSummary> materialize(List<PostDto> posts, Long requesterId) {
    var authorIds = posts.stream().map(PostDto::authorId).distinct().toList();
    var authors = userAssembler.toUserSummaries(authorIds);
    var postIds = posts.stream().map(PostDto::id).toList();
    var tagsByPostId = tagService.getTagsForPosts(requesterId, postIds);
    var previewMediaByPostId = postContentMediaService.getPreviewMediaForPosts(postIds);
    var accessLevelsByPostId = postAccessPolicy.resolveAccessLevels(requesterId, posts);
    var deletableByPostId = postModerationPolicy.resolveDeletable(requesterId, posts);
    var commentableByPostId = postCommentPolicy.resolveCommentable(requesterId, posts);
    var coverMediaIds =
        posts.stream().map(PostDto::coverMediaId).filter(id -> id != null).distinct().toList();
    Map<Long, URL> coverUrlsByMediaId =
        coverMediaIds.isEmpty()
            ? Map.of()
            : mediaDomainService.generatePresignedGetUrlsByIds(coverMediaIds);

    return posts.stream()
        .collect(
            Collectors.toMap(
                PostDto::id,
                post -> {
                  var project =
                      post.projectHandle() == null ? null : postMapper.toProjectSummary(post);
                  var isAuthor = requesterId != null && requesterId.equals(post.authorId());
                  var tags = tagsByPostId.getOrDefault(post.id(), List.of());
                  var accessLevel =
                      accessLevelsByPostId.getOrDefault(post.id(), PostAccessLevel.PREVIEW);
                  var previewMedia =
                      accessLevel == PostAccessLevel.PREVIEW
                          ? List.<GetPostResponse.Media>of()
                          : postMapper.toPreviewMedia(
                              previewMediaByPostId.getOrDefault(post.id(), List.of()));
                  URL coverUrl =
                      post.coverMediaId() == null
                          ? null
                          : coverUrlsByMediaId.get(post.coverMediaId());
                  PostRecruitmentSummary recruitment =
                      post.recruitmentStatus() == null
                          ? null
                          : new PostRecruitmentSummary(
                              post.recruitmentStatus(),
                              post.recruitmentEmploymentType(),
                              post.recruitmentWorkMode(),
                              post.recruitmentLocation(),
                              post.recruitmentExperienceLevel(),
                              post.recruitmentClosesAt());
                  return postMapper.toPostSummary(
                      post,
                      accessLevel,
                      authors.get(post.authorId()),
                      project,
                      isAuthor,
                      deletableByPostId.getOrDefault(post.id(), false),
                      commentableByPostId.getOrDefault(post.id(), false),
                      tags,
                      previewMedia,
                      coverUrl == null ? null : coverUrl.toExternalForm(),
                      recruitment);
                }));
  }
}
