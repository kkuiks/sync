package com.skkil.sync.post.mapper;

import com.skkil.sync.media.dto.MediaDto;
import com.skkil.sync.post.dto.data.PostDto;
import com.skkil.sync.post.dto.response.GetPostResponse;
import com.skkil.sync.post.dto.summary.PostRecruitmentSummary;
import com.skkil.sync.post.dto.summary.PostSummary;
import com.skkil.sync.post.dto.summary.TagSummary;
import com.skkil.sync.post.security.PostAccessLevel;
import com.skkil.sync.project.dto.summary.ProjectSummary;
import com.skkil.sync.user.dto.summary.UserSummary;
import java.util.List;
import org.jspecify.annotations.Nullable;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PostMapper {

  @Mapping(
      target = "scope",
      expression =
          "java(com.skkil.sync.post.model.PostScope.fromProjectHandle(post.projectHandle()))")
  @Mapping(target = "status", source = "post.status")
  @Mapping(target = "createdAt", source = "post.createdAt")
  PostSummary toPostSummary(
      PostDto post,
      PostAccessLevel accessLevel,
      UserSummary author,
      @Nullable ProjectSummary project,
      boolean isAuthor,
      boolean canDelete,
      boolean canComment,
      List<TagSummary> tags,
      List<GetPostResponse.Media> previewMedia,
      @Nullable String coverImageUrl,
      @Nullable PostRecruitmentSummary recruitment);

  List<GetPostResponse.Media> toPreviewMedia(List<MediaDto> media);

  /**
   * 본문 형식을 판별해 그에 맞는 변형을 만든다. 형식은 저장된 값이 아니라 두 본문 컬럼 중 어느 쪽이 채워져 있는지에서 파생되며, 정확히 한쪽만 채워진다는 것은 DB
   * CHECK 제약(posts_content_format_check)이 보장한다.
   */
  default GetPostResponse.Content toContent(PostDto post, List<MediaDto> media) {
    List<GetPostResponse.Media> mappedMedia = toPreviewMedia(media);

    if (post.markdownContent() != null) {
      return new GetPostResponse.MarkdownContent(post.markdownContent(), mappedMedia);
    }

    return new GetPostResponse.TiptapContent(post.content(), mappedMedia);
  }

  @Mapping(target = "handle", source = "projectHandle")
  @Mapping(target = "name", source = "projectName")
  @Mapping(target = "description", source = "projectDescription")
  @Mapping(target = "website", source = "projectWebsite")
  @Mapping(target = "isPublic", source = "projectIsPublic")
  @Mapping(target = "joinPolicy", source = "projectJoinPolicy")
  @Mapping(target = "followerCount", source = "projectFollowerCount")
  @Mapping(target = "iconUrl", ignore = true)
  @Mapping(target = "rules", ignore = true)
  @Mapping(target = "createdAt", ignore = true)
  ProjectSummary toProjectSummary(PostDto post);
}
