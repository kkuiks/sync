package com.skkil.sync.post.repository;

import static com.skkil.sync.jooq.tables.PostTags.POST_TAGS;
import static com.skkil.sync.jooq.tables.Posts.POSTS;
import static com.skkil.sync.jooq.tables.ProjectFollowRelationships.PROJECT_FOLLOW_RELATIONSHIPS;
import static com.skkil.sync.jooq.tables.Projects.PROJECTS;
import static com.skkil.sync.jooq.tables.TagFollowRelationships.TAG_FOLLOW_RELATIONSHIPS;
import static com.skkil.sync.jooq.tables.Tags.TAGS;
import static com.skkil.sync.jooq.tables.UserFollowRelationships.USER_FOLLOW_RELATIONSHIPS;

import com.skkil.sync.common.util.pagination.interfaces.CursorPaginationDataFetcher;
import com.skkil.sync.post.dto.data.PostRecommendationCandidate;
import com.skkil.sync.post.dto.data.PostRecommendationContext;
import com.skkil.sync.post.model.PostScope;
import com.skkil.sync.post.model.PostType;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.impl.DSL;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Repository;

@Repository
public class PostRecommendationQueryRepository {

  private static final double TRENDING_GRAVITY = 1.8;

  /**
   * 인기 정렬용 감쇠 점수(decay score). 좋아요 수를 게시 후 경과 시간의 거듭제곱으로 나누어, 오래된 게시글일수록 순위가 자연스럽게 낮아지도록 한다(Hacker
   * News/Reddit "hot" 랭킹과 동일한 방식). 별도의 기간 제한(WHERE 절)이 없어 트래픽이 적은 시점에도 페이지네이션이 조기에 고갈되지 않는다.
   * SELECT/ORDER BY/WHERE(seek 조건) 전체에서 동일한 표현식을 재사용해야 커서 값과 실제 정렬 결과가 어긋나지 않으므로, 이 상수 하나만 정의해
   * 공유한다.
   */
  public static final Field<Double> TRENDING_SCORE_FIELD =
      DSL.field(
          "{0} / power(extract(epoch from (now() - {1})) / 3600 + 2, {2})",
          Double.class, POSTS.LIKE_COUNT, POSTS.CREATED_AT, DSL.val(TRENDING_GRAVITY));

  private final DSLContext dsl;

  public PostRecommendationQueryRepository(DSLContext dsl) {
    this.dsl = dsl;
  }

  /**
   * 추천 후보 게시글의 ID와 정렬에 필요한 최소 정보만 조회한다. 실제 게시글 데이터는 {@link
   * com.skkil.sync.post.repository.PostQueryRepository#getPostsByIds}로 materialize한다. 정렬 순서는 호출 측에서
   * 전달하는 {@code orderFields}(채널별 {@link
   * com.skkil.sync.common.util.pagination.keyset.KeysetCursorPaginationProvider})에 의해 결정된다.
   *
   * <p>가시성 판정은 다른 게시글 목록 조회와 동일하게 {@link PostConditions}를 재사용한다. 개인 게시글과 프로젝트 게시글이 모두 후보에 포함되므로,
   * 프로젝트 공개 여부를 확인할 수 있도록 PROJECTS 를 left join 한다.
   */
  public CursorPaginationDataFetcher<PostRecommendationCandidate> getCandidates(
      Condition channelCondition, PostRecommendationContext context) {
    return getCandidates(
        channelCondition, context, PostConditions.readablePublished(context.requesterId()));
  }

  /** 공개 탐색 화면에 노출할 수 있는 게시글만 추천 후보로 조회한다. 요청자가 비공개 프로젝트의 팀원이더라도 해당 프로젝트의 게시글은 탐색 후보에서 제외한다. */
  public CursorPaginationDataFetcher<PostRecommendationCandidate> getDiscoveryCandidates(
      Condition channelCondition, PostRecommendationContext context) {
    return getCandidates(channelCondition, context, PostConditions.feedVisible());
  }

  private CursorPaginationDataFetcher<PostRecommendationCandidate> getCandidates(
      Condition channelCondition,
      PostRecommendationContext context,
      Condition visibilityCondition) {
    return (condition, orderFields, size) ->
        dsl.select(
                POSTS.ID.as("id"),
                POSTS.CREATED_AT.as("createdAt"),
                POSTS.LIKE_COUNT.as("likeCount"),
                TRENDING_SCORE_FIELD.as("trendingScore"))
            .from(POSTS)
            .leftJoin(PROJECTS)
            .on(POSTS.PROJECT_ID.eq(PROJECTS.ID))
            .where(
                condition
                    .and(visibilityCondition)
                    .and(PostConditions.general())
                    .and(scopeCondition(context.scope()))
                    .and(postTypeCondition(context.postType()))
                    .and(channelCondition))
            .orderBy(orderFields)
            .limit(size)
            .fetchInto(PostRecommendationCandidate.class);
  }

  public Condition followingCondition(Long requesterId) {
    return DSL.exists(
            dsl.selectOne()
                .from(USER_FOLLOW_RELATIONSHIPS)
                .where(
                    USER_FOLLOW_RELATIONSHIPS.FOLLOWER_ID.eq(requesterId),
                    USER_FOLLOW_RELATIONSHIPS.FOLLOWEE_ID.eq(POSTS.AUTHOR_ID)))
        .or(
            DSL.exists(
                dsl.selectOne()
                    .from(PROJECT_FOLLOW_RELATIONSHIPS)
                    .where(
                        PROJECT_FOLLOW_RELATIONSHIPS.FOLLOWER_ID.eq(requesterId),
                        PROJECT_FOLLOW_RELATIONSHIPS.PROJECT_ID.eq(POSTS.PROJECT_ID))))
        .or(
            DSL.exists(
                dsl.selectOne()
                    .from(POST_TAGS)
                    .join(TAG_FOLLOW_RELATIONSHIPS)
                    .on(TAG_FOLLOW_RELATIONSHIPS.TAG_ID.eq(POST_TAGS.TAG_ID))
                    .join(TAGS)
                    .on(TAGS.ID.eq(POST_TAGS.TAG_ID))
                    .where(
                        POST_TAGS.POST_ID.eq(POSTS.ID),
                        TAG_FOLLOW_RELATIONSHIPS.FOLLOWER_ID.eq(requesterId),
                        TAGS.PROJECT_ID.isNull())));
  }

  private Condition scopeCondition(@Nullable PostScope scope) {
    return scope == null ? DSL.noCondition() : PostConditions.scope(scope);
  }

  private Condition postTypeCondition(@Nullable PostType postType) {
    return postType == null ? DSL.noCondition() : POSTS.POST_TYPE.eq(postType.name());
  }
}
