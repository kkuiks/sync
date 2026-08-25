package com.skkil.sync.post.repository;

import static com.skkil.sync.jooq.tables.Posts.POSTS;
import static org.assertj.core.api.Assertions.assertThat;

import com.skkil.sync.common.config.TestcontainersConfig;
import com.skkil.sync.config.JpaConfig;
import com.skkil.sync.post.model.EmploymentType;
import com.skkil.sync.post.model.ExperienceLevel;
import com.skkil.sync.post.model.Post;
import com.skkil.sync.post.model.PostRecruitment;
import com.skkil.sync.post.model.PostStatus;
import com.skkil.sync.post.model.PostType;
import com.skkil.sync.post.model.RecruitmentStatus;
import com.skkil.sync.post.model.WorkMode;
import com.skkil.sync.project.model.Project;
import com.skkil.sync.project.model.Teammate;
import com.skkil.sync.project.repository.ProjectRepository;
import com.skkil.sync.project.repository.TeammateRepository;
import com.skkil.sync.user.model.User;
import com.skkil.sync.user.repository.UserRepository;
import java.util.List;
import org.jooq.impl.DSL;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({TestcontainersConfig.class, JpaConfig.class, PostQueryRepository.class})
class PostQueryRepositoryTests {

  @Autowired private PostQueryRepository postQueryRepository;

  @Autowired private PostRepository postRepository;

  @Autowired private PostRecruitmentRepository postRecruitmentRepository;

  @Autowired private ProjectRepository projectRepository;

  @Autowired private TeammateRepository teammateRepository;

  @Autowired private UserRepository userRepository;

  @Test
  @DisplayName("[getPostBySlug] 공개 프로젝트의 게시글은 팀원이 아니어도 조회된다")
  void getPostBySlug_publicProjectPost_visibleToNonTeammate() {
    User author = saveUser("public-project-author");
    User outsider = saveUser("public-project-outsider");
    Project project = saveProject("public-project", true);
    Post post = savePost("public-project-post", author, project);

    assertThat(postQueryRepository.getPostBySlug(outsider.getId(), post.getSlug())).isPresent();
    assertThat(postQueryRepository.getPostBySlug(null, post.getSlug())).isPresent();
  }

  @Test
  @DisplayName("[getPostBySlug] 비공개 프로젝트의 게시글은 팀원에게만 조회된다")
  void getPostBySlug_privateProjectPost_visibleToTeammateOnly() {
    User author = saveUser("private-project-author");
    User outsider = saveUser("private-project-outsider");
    Project project = saveProject("private-project", false);
    Post post = savePost("private-project-post", author, project);

    teammateRepository.saveAndFlush(Teammate.owner(project, author));

    assertThat(postQueryRepository.getPostBySlug(author.getId(), post.getSlug())).isPresent();
    assertThat(postQueryRepository.getPostBySlug(outsider.getId(), post.getSlug())).isEmpty();
    assertThat(postQueryRepository.getPostBySlug(null, post.getSlug())).isEmpty();
  }

  @Test
  @DisplayName("[getPinnedPostsByProject] 고정되지 않은 게시글은 제외하고, 비공개 프로젝트는 팀원에게만 노출한다")
  void getPinnedPostsByProject_returnsOnlyPinnedAndRespectsVisibility() {
    User author = saveUser("pinned-post-author");
    User outsider = saveUser("pinned-post-outsider");
    Project project = saveProject("pinned-project", false);
    teammateRepository.saveAndFlush(Teammate.owner(project, author));

    Post pinnedPost = savePost("pinned-post", author, project);
    pinnedPost.pin();
    postRepository.saveAndFlush(pinnedPost);
    savePost("unpinned-post", author, project);

    assertThat(postQueryRepository.getPinnedPostsByProject(author.getId(), project.getHandle()))
        .extracting(dto -> dto.id())
        .containsExactly(pinnedPost.getId());
    assertThat(postQueryRepository.getPinnedPostsByProject(outsider.getId(), project.getHandle()))
        .isEmpty();
  }

  @Test
  @DisplayName("[getTopPostsByProject] 비공개 프로젝트는 팀원에게만 노출한다")
  void getTopPostsByProject_respectsVisibility() {
    User author = saveUser("top-post-author");
    User outsider = saveUser("top-post-outsider");
    Project project = saveProject("top-post-project", false);
    teammateRepository.saveAndFlush(Teammate.owner(project, author));

    Post post = savePost("top-post", author, project);

    assertThat(postQueryRepository.getTopPostsByProject(author.getId(), project.getHandle()))
        .extracting(dto -> dto.id())
        .containsExactly(post.getId());
    assertThat(postQueryRepository.getTopPostsByProject(outsider.getId(), project.getHandle()))
        .isEmpty();
  }

  @Test
  @DisplayName("[getUnansweredQuestionsByProject] 미해결 질문만 포함하고, 비공개 프로젝트는 팀원에게만 노출한다")
  void getUnansweredQuestionsByProject_returnsOnlyUnresolvedQuestions() {
    User author = saveUser("question-author");
    User outsider = saveUser("question-outsider");
    Project project = saveProject("question-project", false);
    teammateRepository.saveAndFlush(Teammate.owner(project, author));

    Post unresolvedQuestion = savePost("unresolved-question", author, project, PostType.QUESTION);

    Post resolvedQuestion = savePost("resolved-question", author, project, PostType.QUESTION);
    resolvedQuestion.resolve();
    postRepository.saveAndFlush(resolvedQuestion);

    savePost("non-question-post", author, project);

    assertThat(
            postQueryRepository.getUnansweredQuestionsByProject(
                author.getId(), project.getHandle()))
        .extracting(dto -> dto.id())
        .containsExactly(unresolvedQuestion.getId());
    assertThat(
            postQueryRepository.getUnansweredQuestionsByProject(
                outsider.getId(), project.getHandle()))
        .isEmpty();
  }

  @Test
  @DisplayName("[getPostBySlug] 프로젝트 초안은 팀원인 작성자 본인에게만 조회된다")
  void getPostBySlug_projectDraft_visibleToAuthorOnly() {
    User author = saveUser("project-draft-author");
    User teammate = saveUser("project-draft-teammate");
    User outsider = saveUser("project-draft-outsider");
    Project project = saveProject("draft-project", true);
    teammateRepository.saveAndFlush(Teammate.owner(project, author));
    teammateRepository.saveAndFlush(Teammate.member(project, teammate));

    Post draft = savePost("project-draft", author, project, PostStatus.DRAFT);

    assertThat(postQueryRepository.getPostBySlug(author.getId(), draft.getSlug())).isPresent();
    // 공개 프로젝트라도 초안은 다른 팀원에게 노출하지 않는다.
    assertThat(postQueryRepository.getPostBySlug(teammate.getId(), draft.getSlug())).isEmpty();
    assertThat(postQueryRepository.getPostBySlug(outsider.getId(), draft.getSlug())).isEmpty();
    assertThat(postQueryRepository.getPostBySlug(null, draft.getSlug())).isEmpty();
  }

  @Test
  @DisplayName("[getPostBySlug] 프로젝트를 떠난 작성자는 자신의 프로젝트 초안을 조회할 수 없다")
  void getPostBySlug_projectDraft_hiddenFromFormerTeammate() {
    User author = saveUser("left-project-author");
    Project project = saveProject("left-project", true);
    Post draft = savePost("left-project-draft", author, project, PostStatus.DRAFT);

    assertThat(postQueryRepository.getPostBySlug(author.getId(), draft.getSlug())).isEmpty();
  }

  @Test
  @DisplayName("[getPostBySlug] 개인 초안은 작성자 본인에게만 조회된다")
  void getPostBySlug_personalDraft_visibleToAuthorOnly() {
    User author = saveUser("personal-draft-author");
    User outsider = saveUser("personal-draft-outsider");

    Post draft = savePost("personal-draft", author, null, PostStatus.DRAFT);

    assertThat(postQueryRepository.getPostBySlug(author.getId(), draft.getSlug())).isPresent();
    assertThat(postQueryRepository.getPostBySlug(outsider.getId(), draft.getSlug())).isEmpty();
    assertThat(postQueryRepository.getPostBySlug(null, draft.getSlug())).isEmpty();
  }

  @Test
  @DisplayName("[getPosts] 구인글은 일반 게시글 목록에서 제외된다")
  void getPosts_excludesRecruitmentPosts() {
    User author = saveUser("general-feed-author");
    Post general = savePost("general-feed-post", author, null);
    Post recruitment = savePost("recruitment-feed-post", author, null);
    saveRecruitment(recruitment);

    var posts =
        postQueryRepository
            .getPosts(author.getId())
            .fetch(DSL.trueCondition(), List.of(POSTS.CREATED_AT.desc(), POSTS.ID.desc()), 10);

    assertThat(posts)
        .extracting(dto -> dto.id())
        .contains(general.getId())
        .doesNotContain(recruitment.getId());
  }

  @Test
  @DisplayName("[getPostBySlug] 구인글 상세 조회는 구인 메타데이터를 포함한다")
  void getPostBySlug_recruitmentPost_includesRecruitmentMetadata() {
    User author = saveUser("recruitment-detail-author");
    Post recruitment = savePost("recruitment-detail-post", author, null);
    saveRecruitment(recruitment);

    assertThat(postQueryRepository.getPostBySlug(author.getId(), recruitment.getSlug()))
        .get()
        .satisfies(
            post -> {
              assertThat(post.recruitmentStatus()).isEqualTo(RecruitmentStatus.OPEN);
              assertThat(post.recruitmentEmploymentType()).isEqualTo(EmploymentType.FULL_TIME);
              assertThat(post.recruitmentWorkMode()).isEqualTo(WorkMode.HYBRID);
              assertThat(post.recruitmentLocation()).isEqualTo("서울");
              assertThat(post.recruitmentExperienceLevel()).isEqualTo(ExperienceLevel.MID);
            });
  }

  @Test
  @DisplayName("[getRecruitmentPosts] 구인글은 메타데이터 필터와 함께 전용 목록에 노출된다")
  void getRecruitmentPosts_returnsMatchingRecruitmentPosts() {
    User author = saveUser("recruitment-list-author");
    Post recruitment = savePost("matching-recruitment-post", author, null);
    saveRecruitment(recruitment);
    savePost("ordinary-post", author, null);

    var posts =
        postQueryRepository
            .getRecruitmentPosts(
                author.getId(),
                RecruitmentStatus.OPEN,
                EmploymentType.FULL_TIME,
                WorkMode.HYBRID,
                ExperienceLevel.MID,
                "서울",
                null,
                "본문")
            .fetch(DSL.trueCondition(), List.of(POSTS.CREATED_AT.desc(), POSTS.ID.desc()), 10);

    assertThat(posts)
        .singleElement()
        .satisfies(
            post -> {
              assertThat(post.id()).isEqualTo(recruitment.getId());
              assertThat(post.recruitmentStatus()).isEqualTo(RecruitmentStatus.OPEN);
              assertThat(post.recruitmentEmploymentType()).isEqualTo(EmploymentType.FULL_TIME);
            });
  }

  private User saveUser(String key) {
    return userRepository.saveAndFlush(
        User.builder().email(key + "@example.com").fullName("사용자").build());
  }

  private Project saveProject(String handle, boolean isPublic) {
    return projectRepository.saveAndFlush(
        Project.builder().handle(handle).name(handle).isPublic(isPublic).build());
  }

  private Post savePost(String slug, User author, @Nullable Project project) {
    return savePost(slug, author, project, PostStatus.PUBLISHED);
  }

  private Post savePost(String slug, User author, @Nullable Project project, PostStatus status) {
    return savePost(slug, author, project, status, PostType.SHORT);
  }

  private Post savePost(String slug, User author, @Nullable Project project, PostType type) {
    return savePost(slug, author, project, PostStatus.PUBLISHED, type);
  }

  private Post savePost(
      String slug, User author, @Nullable Project project, PostStatus status, PostType type) {
    Post post =
        Post.builder()
            .slug(slug)
            .author(author)
            .project(project)
            .type(type)
            .status(status)
            .jsonContent("본문")
            .build();
    post.updateJsonContent("본문", "본문", 0);

    return postRepository.saveAndFlush(post);
  }

  private void saveRecruitment(Post post) {
    postRecruitmentRepository.saveAndFlush(
        new PostRecruitment(
            post, EmploymentType.FULL_TIME, WorkMode.HYBRID, "서울", ExperienceLevel.MID, null));
  }
}
