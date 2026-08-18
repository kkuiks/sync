package com.skkil.sync.post.repository;

import static com.skkil.sync.jooq.tables.PostRecruitments.POST_RECRUITMENTS;
import static com.skkil.sync.jooq.tables.Posts.POSTS;
import static com.skkil.sync.jooq.tables.Projects.PROJECTS;
import static com.skkil.sync.jooq.tables.Teammates.TEAMMATES;

import com.skkil.sync.post.model.PostScope;
import com.skkil.sync.post.model.PostStatus;
import com.skkil.sync.post.model.PostVisibility;
import org.jooq.Condition;
import org.jooq.impl.DSL;

/**
 * 게시글 가시성/열람 조건을 한 곳에 모은 헬퍼. 게시글을 나열하는 모든 조회(피드, 태그, 프로젝트, 북마크, 추천 등)는 저마다 조건을 새로 정의하지 않고 이 클래스를
 * 재사용해야 한다. 패키지 접근 제한자를 쓰는 이유는 {@code com.skkil.sync.post.repository} 패키지의 형제 리포지토리(예: {@link
 * PostRecommendationQueryRepository})도 재사용할 수 있게 하기 위함이다.
 */
final class PostConditions {

  private PostConditions() {}

  static Condition visible() {
    return POSTS.VISIBILITY.eq(PostVisibility.VISIBLE.name());
  }

  static Condition published() {
    return POSTS.STATUS.eq(PostStatus.PUBLISHED.name());
  }

  /** 전용 구인 화면이 아닌 일반 게시글 목록에서 사용할 콘텐츠 채널 조건. */
  static Condition general() {
    return DSL.notExists(
        DSL.selectOne().from(POST_RECRUITMENTS).where(POST_RECRUITMENTS.POST_ID.eq(POSTS.ID)));
  }

  static Condition recruitment() {
    return DSL.exists(
        DSL.selectOne().from(POST_RECRUITMENTS).where(POST_RECRUITMENTS.POST_ID.eq(POSTS.ID)));
  }

  private static Condition personalPublished() {
    return visible().and(POSTS.PROJECT_ID.isNull()).and(published());
  }

  static Condition workspacePublished() {
    return visible().and(POSTS.PROJECT_ID.isNotNull()).and(published());
  }

  // 프로젝트가 공개(public)로 설정된 경우, 해당 프로젝트의 게시글은 팀원이 아니어도 읽을 수 있다.
  static Condition publicProject() {
    return PROJECTS.IS_PUBLIC.isTrue();
  }

  // 공개 피드(전체 게시글 목록)에 노출 가능한 게시글: 프로젝트에 속하지 않은 개인 게시글이거나,
  // 공개 프로젝트에 속한 게시글. 비공개 프로젝트 게시글은 작성자/팀원 여부와 무관하게 피드에서 제외한다.
  static Condition feedVisible() {
    return personalPublished().or(workspacePublished().and(publicProject()));
  }

  // 발행/노출 상태이면서 요청자가 읽을 수 있는 게시글: 개인 게시글이거나, 공개 프로젝트의 게시글이거나,
  // 요청자가 팀원인 프로젝트의 게시글. 초안은 작성자 본인에게도 노출하지 않으므로 태그/추천처럼 "이미 발행된
  // 게시글만 나열하는" 목록 조회에서 공통으로 사용한다.
  static Condition readablePublished(Long requesterId) {
    return visible()
        .and(published())
        .and(POSTS.PROJECT_ID.isNull().or(publicProject()).or(teammate(requesterId)));
  }

  // 개인 게시글(PUBLIC)과 프로젝트 게시글(WORKSPACE) 중 한쪽만 남긴다. PostScope 는 저장된 컬럼이 아니라
  // PROJECT_ID 의 null 여부에서 파생되는 값이므로(PostScope.fromProject), 조건도 동일하게 표현한다.
  static Condition scope(PostScope scope) {
    return scope == PostScope.WORKSPACE ? POSTS.PROJECT_ID.isNotNull() : POSTS.PROJECT_ID.isNull();
  }

  // 워크스페이스(프로젝트) 게시글은 현재 팀원에게만 접근을 허용한다. 작성자라도 프로젝트에서
  // 나가거나 추방되면(TEAMMATES 레코드 삭제) 접근 권한을 잃는다. 그래서 readable() 이 작성자
  // 분기를 둘 때도 이 조건을 함께 AND 로 걸어, 작성자라는 사실만으로는 접근이 열리지 않게 한다.
  static Condition teammate(Long requesterId) {
    if (requesterId == null) {
      return DSL.falseCondition();
    }

    return DSL.exists(
        DSL.selectOne()
            .from(TEAMMATES)
            .where(TEAMMATES.PROJECT_ID.eq(POSTS.PROJECT_ID))
            .and(TEAMMATES.USER_ID.eq(requesterId)));
  }

  static Condition readable(Long requesterId) {
    Condition publiclyReadable = feedVisible();
    if (requesterId == null) {
      return publiclyReadable;
    }

    // 개인 게시글(PROJECT_ID null)은 작성자 본인에게 항상 노출한다(초안 포함). 워크스페이스 게시글은
    // 어느 경우에도 현재 팀원에게만 노출한다. 프로젝트에서 나가거나 추방되면 자기가 쓴 글이라도 접근
    // 권한을 잃는다는 규칙은 그대로 유지되며, 발행 여부만 작성자에게 한해 완화한다.
    //
    // 마지막 절(미발행 워크스페이스 게시글 -> 작성자 본인)이 없으면 작성자가 자기 프로젝트 초안을 열 수
    // 없다. 초안 목록(getDraftsByAuthor)은 프로젝트 초안을 보여주므로, 그 목록에서 클릭해 들어간
    // /posts/{slug} 와 편집 화면이 404 가 되는 상태였다.
    return visible()
        .and(
            publiclyReadable
                .or(POSTS.PROJECT_ID.isNull().and(POSTS.AUTHOR_ID.eq(requesterId)))
                .or(workspacePublished().and(teammate(requesterId)))
                .or(
                    POSTS
                        .PROJECT_ID
                        .isNotNull()
                        .and(POSTS.AUTHOR_ID.eq(requesterId))
                        .and(teammate(requesterId))));
  }
}
