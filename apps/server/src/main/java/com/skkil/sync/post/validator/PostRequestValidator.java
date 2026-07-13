package com.skkil.sync.post.validator;

import com.skkil.sync.post.dto.request.CreatePostRequest;
import com.skkil.sync.post.dto.request.UpdatePostRequest;
import com.skkil.sync.post.exception.InvalidPostPublishRequestException;
import com.skkil.sync.post.model.Post;
import com.skkil.sync.post.model.PostStatus;
import com.skkil.sync.post.model.PostType;
import java.util.List;

public final class PostRequestValidator {

  private PostRequestValidator() {}

  public static void validateCreate(CreatePostRequest request, PostStatus status) {
    validatePublishablePost(request.title(), request.type(), request.tags(), status);
  }

  public static void validateUpdate(UpdatePostRequest request) {
    validatePublishablePost(request.title(), request.type(), request.tags(), request.status());
  }

  public static void validateStatusTransition(Post post, PostStatus requestedStatus) {
    if (post.isPublished() && requestedStatus == PostStatus.DRAFT) {
      throw new InvalidPostPublishRequestException("Published posts cannot be reverted to draft.");
    }
  }

  private static void validatePublishablePost(
      String title, PostType type, List<String> tags, PostStatus status) {
    if (status != PostStatus.PUBLISHED) {
      return;
    }

    if (requiresTitle(type) && isBlank(title)) {
      throw new InvalidPostPublishRequestException(
          "Published article and question posts require a title.");
    }

    if (!hasPublishableTags(tags)) {
      throw new InvalidPostPublishRequestException("Published posts require at least one tag.");
    }
  }

  private static boolean requiresTitle(PostType type) {
    return type != PostType.SHORT;
  }

  private static boolean hasPublishableTags(List<String> tags) {
    return tags != null && tags.stream().anyMatch(tag -> tag != null && !tag.isBlank());
  }

  private static boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
