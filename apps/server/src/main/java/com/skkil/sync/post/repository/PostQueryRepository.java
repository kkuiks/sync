package com.skkil.sync.post.repository;

import static com.skkil.sync.jooq.tables.Comments.COMMENTS;
import static com.skkil.sync.jooq.tables.Oauth2RegisteredClient.OAUTH2_REGISTERED_CLIENT;
import static com.skkil.sync.jooq.tables.PostBookmarks.POST_BOOKMARKS;
import static com.skkil.sync.jooq.tables.PostLikes.POST_LIKES;
import static com.skkil.sync.jooq.tables.PostRecruitments.POST_RECRUITMENTS;
import static com.skkil.sync.jooq.tables.PostReferences.POST_REFERENCES;
import static com.skkil.sync.jooq.tables.PostTags.POST_TAGS;
import static com.skkil.sync.jooq.tables.Posts.POSTS;
import static com.skkil.sync.jooq.tables.Projects.PROJECTS;
import static com.skkil.sync.jooq.tables.Tags.TAGS;
import static com.skkil.sync.jooq.tables.Users.USERS;
import static com.skkil.sync.post.repository.pagination.CommentedPostCursorPaginationProvider.COMMENTED_AT;

import com.skkil.sync.common.util.pagination.interfaces.CursorPaginationDataFetcher;
import com.skkil.sync.post.constants.PostConstants;
import com.skkil.sync.post.dto.data.PostDto;
import com.skkil.sync.post.model.EmploymentType;
import com.skkil.sync.post.model.ExperienceLevel;
import com.skkil.sync.post.model.PostScope;
import com.skkil.sync.post.model.PostStatus;
import com.skkil.sync.post.model.PostType;
import com.skkil.sync.post.model.RecruitmentStatus;
import com.skkil.sync.post.model.WorkMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.SelectFieldOrAsterisk;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

@Repository
public class PostQueryRepository {

  private final DSLContext dsl;

  public PostQueryRepository(DSLContext dsl) {
    this.dsl = dsl;
  }

  public Optional<PostDto> getPostBySlug(Long requesterId, String slug) {
    return dsl.select(post(requesterId, true))
        .from(POSTS)
        .leftJoin(PROJECTS)
        .on(POSTS.PROJECT_ID.eq(PROJECTS.ID))
        .where(POSTS.SLUG.eq(slug).and(PostConditions.readable(requesterId)))
        .fetchOptionalInto(PostDto.class);
  }

  public CursorPaginationDataFetcher<PostDto> getPosts(Long requesterId) {
    return (condition, orderFields, size) ->
        dsl.select(post(requesterId))
            .from(POSTS)
            .leftJoin(PROJECTS)
            .on(POSTS.PROJECT_ID.eq(PROJECTS.ID))
            .where(condition.and(PostConditions.feedVisible()).and(PostConditions.general()))
            .orderBy(orderFields)
            .limit(size)
            .fetchInto(PostDto.class);
  }

  public CursorPaginationDataFetcher<PostDto> getRecruitmentPosts(
      Long requesterId,
      RecruitmentStatus status,
      EmploymentType employmentType,
      WorkMode workMode,
      ExperienceLevel experienceLevel,
      String location,
      String tag,
      String query) {
    return (condition, orderFields, size) -> {
      Condition recruitmentCondition =
          condition
              .and(PostConditions.readablePublished(requesterId))
              .and(POSTS.PROJECT_ID.isNull());

      if (status != null) {
        recruitmentCondition = recruitmentCondition.and(POST_RECRUITMENTS.STATUS.eq(status.name()));
      }
      if (employmentType != null) {
        recruitmentCondition =
            recruitmentCondition.and(POST_RECRUITMENTS.EMPLOYMENT_TYPE.eq(employmentType.name()));
      }
      if (workMode != null) {
        recruitmentCondition =
            recruitmentCondition.and(POST_RECRUITMENTS.WORK_MODE.eq(workMode.name()));
      }
      if (experienceLevel != null) {
        recruitmentCondition =
            recruitmentCondition.and(POST_RECRUITMENTS.EXPERIENCE_LEVEL.eq(experienceLevel.name()));
      }
      if (location != null && !location.isBlank()) {
        recruitmentCondition =
            recruitmentCondition.and(
                POST_RECRUITMENTS.LOCATION.containsIgnoreCase(location.trim()));
      }
      if (tag != null && !tag.isBlank()) {
        recruitmentCondition =
            recruitmentCondition.and(
                DSL.exists(
                    DSL.selectOne()
                        .from(POST_TAGS)
                        .join(TAGS)
                        .on(TAGS.ID.eq(POST_TAGS.TAG_ID))
                        .where(POST_TAGS.POST_ID.eq(POSTS.ID))
                        .and(TAGS.NAME.equalIgnoreCase(tag.trim()))));
      }
      if (query != null && !query.isBlank()) {
        String keyword = query.trim();
        recruitmentCondition =
            recruitmentCondition.and(
                POSTS
                    .TITLE
                    .containsIgnoreCase(keyword)
                    .or(POSTS.PREVIEW.containsIgnoreCase(keyword)));
      }

      return dsl.select(post(requesterId))
          .from(POSTS)
          .join(POST_RECRUITMENTS)
          .on(POST_RECRUITMENTS.POST_ID.eq(POSTS.ID))
          .leftJoin(PROJECTS)
          .on(POSTS.PROJECT_ID.eq(PROJECTS.ID))
          .where(recruitmentCondition)
          .orderBy(orderFields)
          .limit(size)
          .fetchInto(PostDto.class);
    };
  }

  public CursorPaginationDataFetcher<PostDto> getPostsByUser(
      Long requesterId, Long userId, PostType type) {
    return (condition, orderFields, size) -> {
      Condition userCondition = condition.and(POSTS.AUTHOR_ID.eq(userId));
      if (type != null) {
        userCondition = userCondition.and(POSTS.POST_TYPE.eq(type.name()));
      }

      CursorPaginationDataFetcher<PostDto> base = getPosts(requesterId);
      return base.fetch(userCondition, orderFields, size);
    };
  }

  public CursorPaginationDataFetcher<PostDto> getPostsByTag(
      Long requesterId, Long tagId, PostType type) {
    return (condition, orderFields, size) -> {
      Condition tagCondition = condition.and(POST_TAGS.TAG_ID.eq(tagId));
      if (type != null) {
        tagCondition = tagCondition.and(POSTS.POST_TYPE.eq(type.name()));
      }

      return dsl.select(post(requesterId))
          .from(POSTS)
          .join(POST_TAGS)
          .on(POST_TAGS.POST_ID.eq(POSTS.ID))
          .leftJoin(PROJECTS)
          .on(POSTS.PROJECT_ID.eq(PROJECTS.ID))
          .where(
              tagCondition
                  .and(PostConditions.readablePublished(requesterId))
                  .and(PostConditions.general()))
          .orderBy(orderFields)
          .limit(size)
          .fetchInto(PostDto.class);
    };
  }

  public CursorPaginationDataFetcher<PostDto> getPostsByProject(
      Long requesterId, String handle, PostType type, String authorHandle) {
    return (condition, orderFields, size) -> {
      Condition projectCondition =
          condition
              .and(PROJECTS.HANDLE.eq(handle))
              .and(PostConditions.workspacePublished())
              .and(PostConditions.general())
              .and(PostConditions.publicProject().or(PostConditions.teammate(requesterId)));
      if (type != null) {
        projectCondition = projectCondition.and(POSTS.POST_TYPE.eq(type.name()));
      }
      if (authorHandle != null) {
        projectCondition = projectCondition.and(USERS.HANDLE.eq(authorHandle));
      }

      return dsl.select(post(requesterId))
          .from(POSTS)
          .join(USERS)
          .on(POSTS.AUTHOR_ID.eq(USERS.ID))
          .join(PROJECTS)
          .on(POSTS.PROJECT_ID.eq(PROJECTS.ID))
          .where(projectCondition)
          .orderBy(orderFields)
          .limit(size)
          .fetchInto(PostDto.class);
    };
  }

  public List<PostDto> getPinnedPostsByProject(Long requesterId, String handle) {
    Condition pinnedCondition =
        PROJECTS
            .HANDLE
            .eq(handle)
            .and(POSTS.PINNED_AT.isNotNull())
            .and(PostConditions.general())
            .and(PostConditions.workspacePublished())
            .and(PostConditions.publicProject().or(PostConditions.teammate(requesterId)));

    return dsl.select(post(requesterId))
        .from(POSTS)
        .join(PROJECTS)
        .on(POSTS.PROJECT_ID.eq(PROJECTS.ID))
        .where(pinnedCondition)
        .orderBy(POSTS.PINNED_AT.desc())
        .limit(PostConstants.MAX_PINNED_POSTS_PER_PROJECT)
        .fetchInto(PostDto.class);
  }

  public CursorPaginationDataFetcher<PostDto> getDraftsByAuthor(
      Long requesterId, PostType type, PostScope scope, String projectHandle) {
    return (condition, orderFields, size) -> {
      Condition draftCondition =
          condition
              .and(POSTS.AUTHOR_ID.eq(requesterId))
              .and(POSTS.STATUS.eq(PostStatus.DRAFT.name()))
              .and(PostConditions.visible())
              .and(PostConditions.general());

      if (type != null) {
        draftCondition = draftCondition.and(POSTS.POST_TYPE.eq(type.name()));
      }

      if (scope != null) {
        draftCondition = draftCondition.and(PostConditions.scope(scope));
      }

      if (projectHandle != null) {
        draftCondition = draftCondition.and(PROJECTS.HANDLE.eq(projectHandle));
      }

      return dsl.select(post(requesterId))
          .from(POSTS)
          .leftJoin(PROJECTS)
          .on(POSTS.PROJECT_ID.eq(PROJECTS.ID))
          .where(draftCondition)
          .orderBy(orderFields)
          .limit(size)
          .fetchInto(PostDto.class);
    };
  }

  public CursorPaginationDataFetcher<PostDto> getBookmarkedPosts(
      Long userId, String projectHandle) {
    return (condition, orderFields, size) -> {
      Condition bookmarkCondition =
          condition.and(POST_BOOKMARKS.USER_ID.eq(userId)).and(PostConditions.readable(userId));

      if (projectHandle != null) {
        bookmarkCondition = bookmarkCondition.and(PROJECTS.HANDLE.eq(projectHandle));
      }

      return dsl.select(post(userId, POST_BOOKMARKS.CREATED_AT))
          .from(POST_BOOKMARKS)
          .join(POSTS)
          .on(POST_BOOKMARKS.POST_ID.eq(POSTS.ID))
          .leftJoin(PROJECTS)
          .on(POSTS.PROJECT_ID.eq(PROJECTS.ID))
          .where(bookmarkCondition)
          .orderBy(orderFields)
          .limit(size)
          .fetchInto(PostDto.class);
    };
  }

  public CursorPaginationDataFetcher<PostDto> getLikedPosts(Long userId, String projectHandle) {
    return (condition, orderFields, size) -> {
      Condition likeCondition =
          condition.and(POST_LIKES.USER_ID.eq(userId)).and(PostConditions.readable(userId));

      if (projectHandle != null) {
        likeCondition = likeCondition.and(PROJECTS.HANDLE.eq(projectHandle));
      }

      return dsl.select(post(userId, POST_LIKES.CREATED_AT))
          .from(POST_LIKES)
          .join(POSTS)
          .on(POST_LIKES.POST_ID.eq(POSTS.ID))
          .leftJoin(PROJECTS)
          .on(POSTS.PROJECT_ID.eq(PROJECTS.ID))
          .where(likeCondition)
          .orderBy(orderFields)
          .limit(size)
          .fetchInto(PostDto.class);
    };
  }

  public CursorPaginationDataFetcher<PostDto> getCommentedPosts(Long userId, String projectHandle) {
    return (condition, orderFields, size) -> {
      var commentedPosts =
          dsl.select(COMMENTS.POST_ID.as("postId"), DSL.max(COMMENTS.CREATED_AT).as("commentedAt"))
              .from(COMMENTS)
              .where(COMMENTS.AUTHOR_ID.eq(userId).and(COMMENTS.DELETED_AT.isNull()))
              .groupBy(COMMENTS.POST_ID)
              .asTable(DSL.name("commented_posts"));

      Condition commentedCondition = condition.and(PostConditions.readable(userId));
      if (projectHandle != null) {
        commentedCondition = commentedCondition.and(PROJECTS.HANDLE.eq(projectHandle));
      }

      return dsl.select(post(userId, COMMENTED_AT))
          .from(commentedPosts)
          .join(POSTS)
          .on(POSTS.ID.eq(DSL.field(DSL.name("commented_posts", "postId"), Long.class)))
          .leftJoin(PROJECTS)
          .on(POSTS.PROJECT_ID.eq(PROJECTS.ID))
          .where(commentedCondition)
          .orderBy(orderFields)
          .limit(size)
          .fetchInto(PostDto.class);
    };
  }

  public List<PostDto> getReferencedPosts(Long requesterId, Long sourcePostId) {
    return dsl.select(post(requesterId))
        .from(POSTS)
        .join(POST_REFERENCES)
        .on(POST_REFERENCES.REFERENCED_POST_ID.eq(POSTS.ID))
        .leftJoin(PROJECTS)
        .on(POSTS.PROJECT_ID.eq(PROJECTS.ID))
        .where(
            POST_REFERENCES
                .SOURCE_POST_ID
                .eq(sourcePostId)
                .and(PostConditions.readable(requesterId))
                .and(PostConditions.general()))
        .orderBy(POST_REFERENCES.SORT_ORDER.asc())
        .fetchInto(PostDto.class);
  }

  public CursorPaginationDataFetcher<PostDto> getBacklinkPosts(
      Long requesterId, Long targetPostId) {
    return (condition, orderFields, size) ->
        dsl.select(post(requesterId))
            .from(POSTS)
            .join(POST_REFERENCES)
            .on(POST_REFERENCES.SOURCE_POST_ID.eq(POSTS.ID))
            .leftJoin(PROJECTS)
            .on(POSTS.PROJECT_ID.eq(PROJECTS.ID))
            .where(
                condition
                    .and(POST_REFERENCES.REFERENCED_POST_ID.eq(targetPostId))
                    .and(PostConditions.readable(requesterId))
                    .and(PostConditions.general()))
            .orderBy(orderFields)
            .limit(size)
            .fetchInto(PostDto.class);
  }

  public List<PostDto> getPostsByIds(Long requesterId, List<Long> ids) {
    return getPostsByIds(
        requesterId, ids, POSTS.ID.in(ids).and(PostConditions.readable(requesterId)));
  }

  public List<PostDto> getPostsByIdsInProject(
      Long requesterId, List<Long> ids, String projectHandle) {
    return getPostsByIds(
        requesterId,
        ids,
        POSTS
            .ID
            .in(ids)
            .and(PostConditions.readable(requesterId))
            .and(PostConditions.published())
            .and(PROJECTS.HANDLE.eq(projectHandle)));
  }

  private List<PostDto> getPostsByIds(Long requesterId, List<Long> ids, Condition condition) {
    if (ids.isEmpty()) {
      return List.of();
    }

    Map<Long, PostDto> byId =
        dsl
            .select(post(requesterId))
            .from(POSTS)
            .leftJoin(PROJECTS)
            .on(POSTS.PROJECT_ID.eq(PROJECTS.ID))
            .where(condition)
            .fetchInto(PostDto.class)
            .stream()
            .collect(Collectors.toMap(PostDto::id, Function.identity()));

    return ids.stream().map(byId::get).filter(dto -> dto != null).toList();
  }

  private List<SelectFieldOrAsterisk> post(Long requesterId) {
    return post(requesterId, POSTS.CREATED_AT, false);
  }

  private List<SelectFieldOrAsterisk> post(Long requesterId, boolean shouldFetchContent) {
    return post(requesterId, POSTS.CREATED_AT, shouldFetchContent);
  }

  private List<SelectFieldOrAsterisk> post(Long requesterId, Field<OffsetDateTime> sortKey) {
    return post(requesterId, sortKey, false);
  }

  // Shared by every query method below. POSTS.CONTENT is only ever the real column for
  // getPostBySlug (shouldFetchContent = true) — every list-shaped query gets a null
  // placeholder in its place instead of paying for the unbounded payload, while still
  // keeping the selected column count aligned with PostDto's record components.
  private List<SelectFieldOrAsterisk> post(
      Long requesterId, Field<OffsetDateTime> sortKey, boolean shouldFetchContent) {
    Field<Boolean> bookmarked =
        requesterId == null
            ? DSL.value(false)
            : DSL.field(
                DSL.exists(
                    DSL.selectOne()
                        .from(POST_BOOKMARKS)
                        .where(POST_BOOKMARKS.POST_ID.eq(POSTS.ID))
                        .and(POST_BOOKMARKS.USER_ID.eq(requesterId))));

    Field<Boolean> liked =
        requesterId == null
            ? DSL.value(false)
            : DSL.field(
                DSL.exists(
                    DSL.selectOne()
                        .from(POST_LIKES)
                        .where(POST_LIKES.POST_ID.eq(POSTS.ID))
                        .and(POST_LIKES.USER_ID.eq(requesterId))));

    Field<String> content =
        shouldFetchContent ? POSTS.CONTENT : DSL.value((String) null, POSTS.CONTENT.getDataType());

    // Markdown 본문도 content 와 같은 이유로 상세 조회에서만 싣는다. 두 컬럼 중 정확히 한쪽만
    // 채워져 있으므로(posts_content_format_check), 응답 매핑에서 어느 쪽이 null 이 아닌지로
    // 본문 형식을 판별할 수 있다.
    Field<String> markdownContent =
        shouldFetchContent
            ? POSTS.MARKDOWN_CONTENT
            : DSL.value((String) null, POSTS.MARKDOWN_CONTENT.getDataType());

    // "🤖 {clientName} 으로 작성됨" 배지의 출처. 목록 조회에서도 필요하므로 항상 싣되, 조인을
    // 추가해 기존 쿼리 구조를 흔들지 않도록 스칼라 서브쿼리로 가져온다. 사람이 쓴 글은 null 이다.
    Field<String> createdViaClientName =
        DSL.field(
            DSL.select(OAUTH2_REGISTERED_CLIENT.CLIENT_NAME)
                .from(OAUTH2_REGISTERED_CLIENT)
                .where(OAUTH2_REGISTERED_CLIENT.ID.eq(POSTS.CREATED_VIA_CLIENT_ID)));

    Field<String> recruitmentStatus =
        DSL.field(
            DSL.select(POST_RECRUITMENTS.STATUS)
                .from(POST_RECRUITMENTS)
                .where(POST_RECRUITMENTS.POST_ID.eq(POSTS.ID)));
    Field<String> recruitmentEmploymentType =
        DSL.field(
            DSL.select(POST_RECRUITMENTS.EMPLOYMENT_TYPE)
                .from(POST_RECRUITMENTS)
                .where(POST_RECRUITMENTS.POST_ID.eq(POSTS.ID)));
    Field<String> recruitmentWorkMode =
        DSL.field(
            DSL.select(POST_RECRUITMENTS.WORK_MODE)
                .from(POST_RECRUITMENTS)
                .where(POST_RECRUITMENTS.POST_ID.eq(POSTS.ID)));
    Field<String> recruitmentLocation =
        DSL.field(
            DSL.select(POST_RECRUITMENTS.LOCATION)
                .from(POST_RECRUITMENTS)
                .where(POST_RECRUITMENTS.POST_ID.eq(POSTS.ID)));
    Field<String> recruitmentExperienceLevel =
        DSL.field(
            DSL.select(POST_RECRUITMENTS.EXPERIENCE_LEVEL)
                .from(POST_RECRUITMENTS)
                .where(POST_RECRUITMENTS.POST_ID.eq(POSTS.ID)));
    Field<OffsetDateTime> recruitmentClosesAt =
        DSL.field(
            DSL.select(POST_RECRUITMENTS.CLOSES_AT)
                .from(POST_RECRUITMENTS)
                .where(POST_RECRUITMENTS.POST_ID.eq(POSTS.ID)));

    return List.of(
        POSTS.ID.as("id"),
        POSTS.POST_TYPE.as("type"),
        POSTS.STATUS.as("status"),
        POSTS.SLUG.as("slug"),
        POSTS.TITLE.as("title"),
        POSTS.AUTHOR_ID.as("authorId"),
        PROJECTS.HANDLE.as("projectHandle"),
        PROJECTS.NAME.as("projectName"),
        PROJECTS.DESCRIPTION.as("projectDescription"),
        PROJECTS.WEBSITE_URL.as("projectWebsite"),
        PROJECTS.IS_PUBLIC.as("projectIsPublic"),
        PROJECTS.JOIN_POLICY.as("projectJoinPolicy"),
        PROJECTS.FOLLOWER_COUNT.as("projectFollowerCount"),
        content.as("content"),
        markdownContent.as("markdownContent"),
        createdViaClientName.as("createdViaClientName"),
        POSTS.CREATED_AT.as("createdAt"),
        POSTS.UPDATED_AT.as("updatedAt"),
        POSTS.LIKE_COUNT.as("likeCount"),
        POSTS.COMMENT_COUNT.as("commentCount"),
        liked.as("liked"),
        bookmarked.as("bookmarked"),
        POSTS.RESOLVED.as("resolved"),
        POSTS.PREVIEW.as("preview"),
        POSTS.MEDIA_COUNT.as("mediaCount"),
        POSTS.WORD_COUNT.as("wordCount"),
        POSTS.COVER_MEDIA_ID.as("coverMediaId"),
        POSTS.IS_SERIES_POST.as("isSeriesPost"),
        POSTS.PINNED_AT.as("pinnedAt"),
        recruitmentStatus.as("recruitmentStatus"),
        recruitmentEmploymentType.as("recruitmentEmploymentType"),
        recruitmentWorkMode.as("recruitmentWorkMode"),
        recruitmentLocation.as("recruitmentLocation"),
        recruitmentExperienceLevel.as("recruitmentExperienceLevel"),
        recruitmentClosesAt.as("recruitmentClosesAt"),
        sortKey.as("sortKey"));
  }
}
