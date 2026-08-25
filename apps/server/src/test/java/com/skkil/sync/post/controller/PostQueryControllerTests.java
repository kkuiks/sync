package com.skkil.sync.post.controller;

import static com.epages.restdocs.apispec.MockMvcRestDocumentationWrapper.document;
import static com.epages.restdocs.apispec.Schema.schema;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.epages.restdocs.apispec.ResourceSnippetParameters;
import com.skkil.sync.auth.AuthenticatedUser;
import com.skkil.sync.common.config.TestSecurityConfig;
import com.skkil.sync.common.security.WithAuthenticatedUser;
import com.skkil.sync.common.security.WithAuthenticatedUserSecurityContextFactory;
import com.skkil.sync.common.util.pagination.dto.request.CursorPaginationRequest;
import com.skkil.sync.common.util.pagination.snippets.CursorPaginationRequestSnippets;
import com.skkil.sync.config.SecurityConfig;
import com.skkil.sync.post.dto.response.GetPostResponse;
import com.skkil.sync.post.dto.response.GetPostsResponse;
import com.skkil.sync.post.dto.response.PaginatedGetPostsResponse;
import com.skkil.sync.post.model.PostScope;
import com.skkil.sync.post.model.PostType;
import com.skkil.sync.post.service.PostQueryService;
import com.skkil.sync.post.snippets.GetPostResponseSnippets;
import com.skkil.sync.post.snippets.GetPostsResponseSnippets;
import com.skkil.sync.post.snippets.PaginatedGetPostsResponseSnippets;
import java.util.function.Function;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.restdocs.test.autoconfigure.AutoConfigureRestDocs;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.restdocs.RestDocumentationExtension;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PostQueryController.class)
@AutoConfigureMockMvc(addFilters = true)
@AutoConfigureRestDocs
@ExtendWith(RestDocumentationExtension.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
class PostQueryControllerTests {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private PostQueryService postQueryService;

  @Test
  @DisplayName("[getPosts] API 문서화 테스트")
  void getPosts() throws Exception {
    CursorPaginationRequest pagination =
        CursorPaginationRequestSnippets.getCursorPaginationRequest();
    PaginatedGetPostsResponse response =
        PaginatedGetPostsResponseSnippets.getPaginatedGetPostsResponse();

    when(postQueryService.getPosts(any(), eq(pagination))).thenReturn(response);

    mockMvc
        .perform(
            get("/posts")
                .queryParams(
                    CursorPaginationRequestSnippets.getCursorPaginationRequestQueryParams()))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetPosts",
                ResourceSnippetParameters.builder()
                    .tag("post")
                    .summary("Get Posts")
                    .description("Get Posts")
                    .responseSchema(schema("PaginatedGetPostsResponse")),
                null,
                null,
                Function.identity(),
                CursorPaginationRequestSnippets.getCursorPaginationRequestParameters(),
                PaginatedGetPostsResponseSnippets.getPostsResponseFields()));
  }

  @Test
  @DisplayName("[getDrafts] API 문서화 테스트")
  @WithAuthenticatedUser
  void getDrafts() throws Exception {
    AuthenticatedUser user = WithAuthenticatedUserSecurityContextFactory.getAuthenticatedUser();
    PostType type = PostType.LONG;
    PostScope scope = PostScope.PUBLIC;

    CursorPaginationRequest pagination =
        CursorPaginationRequestSnippets.getCursorPaginationRequest();
    PaginatedGetPostsResponse response =
        PaginatedGetPostsResponseSnippets.getGetDraftPostsResponse();

    when(postQueryService.getDrafts(
            eq(user.userId()), eq(type), eq(scope), isNull(), eq(pagination)))
        .thenReturn(response);

    mockMvc
        .perform(
            get("/posts/drafts")
                .queryParam("type", type.name())
                .queryParam("scope", scope.name())
                .queryParams(
                    CursorPaginationRequestSnippets.getCursorPaginationRequestQueryParams()))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetDraftPosts",
                ResourceSnippetParameters.builder()
                    .tag("post")
                    .summary("Get Draft Posts")
                    .description("Get Draft Posts")
                    .responseSchema(schema("PaginatedGetPostsResponse")),
                null,
                null,
                Function.identity(),
                CursorPaginationRequestSnippets.getCursorPaginationRequestParameters()
                    .and(parameterWithName("type").description("게시글 타입").optional())
                    .and(parameterWithName("scope").description("게시글 공개 범위").optional())
                    .and(
                        parameterWithName("projectHandle")
                            .description("프로젝트로 검색 범위 제한 (선택)")
                            .optional()),
                PaginatedGetPostsResponseSnippets.getPostsResponseFields()));
  }

  @Test
  @DisplayName("[getPostBySlug] API 문서화 테스트")
  @WithAuthenticatedUser
  void getPostBySlug() throws Exception {
    AuthenticatedUser user = WithAuthenticatedUserSecurityContextFactory.getAuthenticatedUser();
    String slug = "test-slug";
    GetPostResponse response = GetPostResponseSnippets.getGetPostResponse();

    when(postQueryService.getPostBySlug(eq(user.userId()), eq(slug))).thenReturn(response);

    mockMvc
        .perform(get("/posts/{slug}", slug))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetPostBySlug",
                ResourceSnippetParameters.builder()
                    .tag("post")
                    .summary("Get Post By Slug")
                    .description("Get Post By Slug")
                    .responseSchema(schema(GetPostResponse.class.getSimpleName())),
                null,
                null,
                Function.identity(),
                GetPostResponseSnippets.getPostResponseFields()));
  }

  @Test
  @DisplayName("[getPostReferences] API 문서화 테스트")
  @WithAuthenticatedUser
  void getPostReferences() throws Exception {
    AuthenticatedUser user = WithAuthenticatedUserSecurityContextFactory.getAuthenticatedUser();
    String slug = "test-slug";
    GetPostsResponse response = GetPostsResponseSnippets.getGetPostsResponse();

    when(postQueryService.getPostReferences(eq(user.userId()), eq(slug))).thenReturn(response);

    mockMvc
        .perform(get("/posts/{slug}/references", slug))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetPostReferences",
                ResourceSnippetParameters.builder()
                    .tag("post")
                    .summary("Get Post References")
                    .description("이 게시글이 가리키는 참조(forward reference) 목록을 조회합니다.")
                    .responseSchema(schema(GetPostsResponse.class.getSimpleName())),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("slug").description("게시글 slug")),
                GetPostsResponseSnippets.getPostsResponseFields()));
  }

  @Test
  @DisplayName("[getPostBacklinks] API 문서화 테스트")
  @WithAuthenticatedUser
  void getPostBacklinks() throws Exception {
    AuthenticatedUser user = WithAuthenticatedUserSecurityContextFactory.getAuthenticatedUser();
    String slug = "test-slug";

    CursorPaginationRequest pagination =
        CursorPaginationRequestSnippets.getCursorPaginationRequest();
    PaginatedGetPostsResponse response =
        PaginatedGetPostsResponseSnippets.getPaginatedGetPostsResponse();

    when(postQueryService.getPostBacklinks(eq(user.userId()), eq(slug), eq(pagination)))
        .thenReturn(response);

    mockMvc
        .perform(
            get("/posts/{slug}/referenced-by", slug)
                .queryParams(
                    CursorPaginationRequestSnippets.getCursorPaginationRequestQueryParams()))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetPostBacklinks",
                ResourceSnippetParameters.builder()
                    .tag("post")
                    .summary("Get Post Backlinks")
                    .description("이 게시글을 가리키는(역참조, backlink) 게시글 목록을 조회합니다.")
                    .responseSchema(schema(PaginatedGetPostsResponse.class.getSimpleName())),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("slug").description("게시글 slug")),
                CursorPaginationRequestSnippets.getCursorPaginationRequestParameters(),
                PaginatedGetPostsResponseSnippets.getPostsResponseFields()));
  }

  @Test
  @DisplayName("[getUserPosts] API 문서화 테스트")
  void getUserPosts() throws Exception {
    Long userId = 1L;
    PostType type = PostType.SHORT;

    CursorPaginationRequest pagination =
        CursorPaginationRequestSnippets.getCursorPaginationRequest();
    PaginatedGetPostsResponse response =
        PaginatedGetPostsResponseSnippets.getPaginatedGetPostsResponse();

    when(postQueryService.getUserPosts(any(), eq(userId), eq(type), eq(pagination)))
        .thenReturn(response);

    mockMvc
        .perform(
            get("/users/{userId}/posts", userId)
                .queryParam("type", type.name())
                .queryParams(
                    CursorPaginationRequestSnippets.getCursorPaginationRequestQueryParams()))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetUserPosts",
                ResourceSnippetParameters.builder()
                    .tag("post")
                    .summary("Get Posts")
                    .description("Get Posts")
                    .responseSchema(schema("PaginatedGetPostsResponse")),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("userId").description("User ID")),
                CursorPaginationRequestSnippets.getCursorPaginationRequestParameters()
                    .and(parameterWithName("type").description("게시글 타입").optional()),
                PaginatedGetPostsResponseSnippets.getPostsResponseFields()));
  }

  @Test
  @DisplayName("[getCommentedPosts] API 문서화 테스트")
  void getCommentedPosts() throws Exception {
    Long userId = 1L;

    CursorPaginationRequest pagination =
        CursorPaginationRequestSnippets.getCursorPaginationRequest();
    PaginatedGetPostsResponse response =
        PaginatedGetPostsResponseSnippets.getPaginatedGetPostsResponse();

    String projectHandle = "sync";

    when(postQueryService.getCommentedPosts(any(), eq(userId), eq(projectHandle), eq(pagination)))
        .thenReturn(response);

    mockMvc
        .perform(
            get("/users/{userId}/posts/commented", userId)
                .queryParam("projectHandle", projectHandle)
                .queryParams(
                    CursorPaginationRequestSnippets.getCursorPaginationRequestQueryParams()))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetCommentedPosts",
                ResourceSnippetParameters.builder()
                    .tag("post")
                    .summary("Get Commented Posts")
                    .description("Get Commented Posts")
                    .responseSchema(schema("PaginatedGetPostsResponse")),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("userId").description("User ID")),
                CursorPaginationRequestSnippets.getCursorPaginationRequestParameters()
                    .and(parameterWithName("projectHandle").description("프로젝트 핸들").optional()),
                PaginatedGetPostsResponseSnippets.getPostsResponseFields()));
  }

  @Test
  @DisplayName("[getPostsByTag] 공개 태그 게시글 API 문서화 테스트")
  void getPostsByTag() throws Exception {
    Long tagId = 1L;
    PostType type = PostType.LONG;

    CursorPaginationRequest pagination =
        CursorPaginationRequestSnippets.getCursorPaginationRequest();
    PaginatedGetPostsResponse response =
        PaginatedGetPostsResponseSnippets.getPaginatedGetPostsResponse();

    when(postQueryService.getPostsByTag(isNull(), eq(tagId), eq(type), eq(pagination)))
        .thenReturn(response);

    mockMvc
        .perform(
            get("/tags/{tagId}/posts", tagId)
                .queryParam("type", type.name())
                .queryParams(
                    CursorPaginationRequestSnippets.getCursorPaginationRequestQueryParams()))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetPostsByTag",
                ResourceSnippetParameters.builder()
                    .tag("post")
                    .summary("Get Posts By Tag")
                    .description("태그가 붙은 공개 게시글 목록을 조회합니다.")
                    .responseSchema(schema(PaginatedGetPostsResponse.class.getSimpleName())),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("tagId").description("태그 ID")),
                CursorPaginationRequestSnippets.getCursorPaginationRequestParameters()
                    .and(parameterWithName("type").description("게시글 타입").optional()),
                PaginatedGetPostsResponseSnippets.getPostsResponseFields()));
  }

  @Test
  @DisplayName("[getPostsByProject] API 문서화 테스트")
  void getPostsByProject() throws Exception {
    String handle = "project";
    PostType type = PostType.SHORT;
    String authorHandle = "author";

    CursorPaginationRequest pagination =
        CursorPaginationRequestSnippets.getCursorPaginationRequest();
    PaginatedGetPostsResponse response =
        PaginatedGetPostsResponseSnippets.getPaginatedGetPostsResponse();

    when(postQueryService.getPostsByProject(
            any(), eq(handle), eq(type), eq(authorHandle), eq(pagination)))
        .thenReturn(response);

    mockMvc
        .perform(
            get("/projects/{handle}/posts", handle)
                .queryParam("type", type.name())
                .queryParam("authorHandle", authorHandle)
                .queryParams(
                    CursorPaginationRequestSnippets.getCursorPaginationRequestQueryParams()))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetPostsByProject",
                ResourceSnippetParameters.builder()
                    .tag("post")
                    .summary("Get Posts By Project")
                    .description("Get Posts By Project")
                    .responseSchema(schema(PaginatedGetPostsResponse.class.getSimpleName())),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("handle").description("프로젝트 핸들")),
                CursorPaginationRequestSnippets.getCursorPaginationRequestParameters()
                    .and(parameterWithName("type").description("게시글 타입").optional())
                    .and(parameterWithName("authorHandle").description("작성자 핸들").optional()),
                PaginatedGetPostsResponseSnippets.getPostsResponseFields()));
  }

  @Test
  @DisplayName("[getPinnedPostsByProject] API 문서화 테스트")
  void getPinnedPostsByProject() throws Exception {
    String handle = "project";
    GetPostsResponse response = GetPostsResponseSnippets.getGetPostsResponse();

    when(postQueryService.getPinnedPostsByProject(any(), eq(handle))).thenReturn(response);

    mockMvc
        .perform(get("/projects/{handle}/posts/pinned", handle))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetPinnedPostsByProject",
                ResourceSnippetParameters.builder()
                    .tag("post")
                    .summary("Get Pinned Posts By Project")
                    .description("프로젝트 대시보드에 고정된 게시글 목록을 조회합니다.")
                    .responseSchema(schema(GetPostsResponse.class.getSimpleName())),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("handle").description("프로젝트 핸들")),
                GetPostsResponseSnippets.getPostsResponseFields()));
  }

  @Test
  @DisplayName("[getTopPostsByProject] API 문서화 테스트")
  void getTopPostsByProject() throws Exception {
    String handle = "project";
    GetPostsResponse response = GetPostsResponseSnippets.getGetPostsResponse();

    when(postQueryService.getTopPostsByProject(any(), eq(handle))).thenReturn(response);

    mockMvc
        .perform(get("/projects/{handle}/posts/top", handle))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetTopPostsByProject",
                ResourceSnippetParameters.builder()
                    .tag("post")
                    .summary("Get Top Posts By Project")
                    .description("최근 7일간 좋아요·댓글이 많은 프로젝트 게시글 목록을 조회합니다.")
                    .responseSchema(schema(GetPostsResponse.class.getSimpleName())),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("handle").description("프로젝트 핸들")),
                GetPostsResponseSnippets.getPostsResponseFields()));
  }

  @Test
  @DisplayName("[getUnansweredQuestionsByProject] API 문서화 테스트")
  void getUnansweredQuestionsByProject() throws Exception {
    String handle = "project";
    GetPostsResponse response = GetPostsResponseSnippets.getGetPostsResponse();

    when(postQueryService.getUnansweredQuestionsByProject(any(), eq(handle))).thenReturn(response);

    mockMvc
        .perform(get("/projects/{handle}/posts/unanswered-questions", handle))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetUnansweredQuestionsByProject",
                ResourceSnippetParameters.builder()
                    .tag("post")
                    .summary("Get Unanswered Questions By Project")
                    .description("아직 답변이 채택되지 않은 프로젝트 질문 게시글 목록을 조회합니다.")
                    .responseSchema(schema(GetPostsResponse.class.getSimpleName())),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("handle").description("프로젝트 핸들")),
                GetPostsResponseSnippets.getPostsResponseFields()));
  }

  @Test
  @DisplayName("[getDrafts] 로그인하지 않은 사용자는 접근할 수 없다")
  void getDrafts_unauthenticatedUser_shouldReturnUnauthorized() throws Exception {
    mockMvc.perform(get("/posts/drafts")).andExpect(status().isUnauthorized());
  }
}
