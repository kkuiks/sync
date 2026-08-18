package com.skkil.sync.post.controller;

import static com.epages.restdocs.apispec.MockMvcRestDocumentationWrapper.document;
import static com.epages.restdocs.apispec.Schema.schema;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessResponse;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.prettyPrint;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.restdocs.request.RequestDocumentation.queryParameters;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.epages.restdocs.apispec.ResourceSnippetParameters;
import com.skkil.sync.auth.AuthenticatedUser;
import com.skkil.sync.common.config.TestSecurityConfig;
import com.skkil.sync.common.security.WithAuthenticatedUser;
import com.skkil.sync.common.security.WithAuthenticatedUserSecurityContextFactory;
import com.skkil.sync.common.util.pagination.dto.request.CursorPaginationRequest;
import com.skkil.sync.common.util.pagination.snippets.CursorPaginationRequestSnippets;
import com.skkil.sync.config.SecurityConfig;
import com.skkil.sync.post.dto.request.CreateRecruitmentPostRequest;
import com.skkil.sync.post.dto.request.UpdateRecruitmentPostRequest;
import com.skkil.sync.post.dto.request.UpdateRecruitmentStatusRequest;
import com.skkil.sync.post.dto.response.CreatePostResponse;
import com.skkil.sync.post.dto.response.PaginatedGetPostsResponse;
import com.skkil.sync.post.model.EmploymentType;
import com.skkil.sync.post.model.ExperienceLevel;
import com.skkil.sync.post.model.RecruitmentStatus;
import com.skkil.sync.post.model.WorkMode;
import com.skkil.sync.post.service.PostQueryService;
import com.skkil.sync.post.service.PostRecruitmentService;
import com.skkil.sync.post.snippets.CreatePostResponseSnippets;
import com.skkil.sync.post.snippets.PaginatedGetPostsResponseSnippets;
import com.skkil.sync.post.snippets.PostRecruitmentRequestSnippets;
import java.util.function.Function;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.restdocs.test.autoconfigure.AutoConfigureRestDocs;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.restdocs.RestDocumentationExtension;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;

@WebMvcTest(PostRecruitmentController.class)
@AutoConfigureMockMvc(addFilters = true)
@AutoConfigureRestDocs
@ExtendWith(RestDocumentationExtension.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
class PostRecruitmentControllerTests {

  @Autowired private MockMvc mockMvc;
  @Autowired private JsonMapper jsonMapper;

  @MockitoBean private PostRecruitmentService postRecruitmentService;
  @MockitoBean private PostQueryService postQueryService;

  @Test
  @DisplayName("[getRecruitmentPosts] 구인글 목록 API 문서화")
  @WithAuthenticatedUser
  void getRecruitmentPosts() throws Exception {
    AuthenticatedUser user = WithAuthenticatedUserSecurityContextFactory.getAuthenticatedUser();
    CursorPaginationRequest pagination =
        CursorPaginationRequestSnippets.getCursorPaginationRequest();
    PaginatedGetPostsResponse response =
        PaginatedGetPostsResponseSnippets.getPaginatedGetPostsResponse();

    when(postQueryService.getRecruitmentPosts(
            eq(user.userId()),
            eq(RecruitmentStatus.OPEN),
            eq(EmploymentType.FULL_TIME),
            eq(WorkMode.HYBRID),
            eq(ExperienceLevel.MID),
            eq("서울"),
            eq("java"),
            eq("백엔드"),
            eq(pagination)))
        .thenReturn(response);

    mockMvc
        .perform(
            get("/recruitment-posts")
                .queryParam("status", "OPEN")
                .queryParam("employmentType", "FULL_TIME")
                .queryParam("workMode", "HYBRID")
                .queryParam("experienceLevel", "MID")
                .queryParam("location", "서울")
                .queryParam("tag", "java")
                .queryParam("query", "백엔드")
                .queryParams(
                    CursorPaginationRequestSnippets.getCursorPaginationRequestQueryParams()))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetRecruitmentPosts",
                ResourceSnippetParameters.builder()
                    .tag("recruitment-post")
                    .summary("구인글 목록 조회")
                    .description("일반 피드와 분리된 구인글 목록을 조회합니다.")
                    .responseSchema(schema(PaginatedGetPostsResponse.class.getSimpleName())),
                null,
                preprocessResponse(prettyPrint()),
                Function.identity(),
                queryParameters(
                    parameterWithName("status").description("모집 상태 (미지정 시 전체)").optional(),
                    parameterWithName("employmentType").description("고용 형태").optional(),
                    parameterWithName("workMode").description("근무 방식").optional(),
                    parameterWithName("experienceLevel").description("경력 수준").optional(),
                    parameterWithName("location").description("근무 지역 검색어").optional(),
                    parameterWithName("tag").description("기술 태그 이름").optional(),
                    parameterWithName("query").description("제목 또는 미리보기 검색어").optional(),
                    parameterWithName("first").description("정방향 조회 개수").optional(),
                    parameterWithName("after").description("정방향 커서").optional(),
                    parameterWithName("last").description("역방향 조회 개수").optional(),
                    parameterWithName("before").description("역방향 커서").optional()),
                PaginatedGetPostsResponseSnippets.getPostsResponseFields()));
  }

  @Test
  @DisplayName("[getRecruitmentPosts] 모집 상태를 생략하면 전체 상태를 조회")
  @WithAuthenticatedUser
  void getRecruitmentPosts_withoutStatus_queriesAllStatuses() throws Exception {
    AuthenticatedUser user = WithAuthenticatedUserSecurityContextFactory.getAuthenticatedUser();
    CursorPaginationRequest pagination = new CursorPaginationRequest(null, null, null, null);

    when(postQueryService.getRecruitmentPosts(
            eq(user.userId()),
            eq(null),
            eq(null),
            eq(null),
            eq(null),
            eq(null),
            eq(null),
            eq(null),
            eq(pagination)))
        .thenReturn(PaginatedGetPostsResponseSnippets.getPaginatedGetPostsResponse());

    mockMvc.perform(get("/recruitment-posts")).andExpect(status().isOk());
  }

  @Test
  @DisplayName("[createRecruitmentPost] 구인글 생성 API 문서화")
  @WithAuthenticatedUser
  void createRecruitmentPost() throws Exception {
    AuthenticatedUser user = WithAuthenticatedUserSecurityContextFactory.getAuthenticatedUser();
    CreateRecruitmentPostRequest request = PostRecruitmentRequestSnippets.getCreateRequest();
    CreatePostResponse response = CreatePostResponseSnippets.getCreatePostResponse();
    when(postRecruitmentService.createRecruitmentPost(eq(user.userId()), any()))
        .thenReturn(response);

    mockMvc
        .perform(
            post("/recruitment-posts")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andDo(
            document(
                "CreateRecruitmentPost",
                ResourceSnippetParameters.builder()
                    .tag("recruitment-post")
                    .summary("구인글 생성")
                    .description("개인 LONG 게시글을 기반으로 구인글을 생성합니다.")
                    .requestSchema(schema(CreateRecruitmentPostRequest.class.getSimpleName()))
                    .responseSchema(schema(CreatePostResponse.class.getSimpleName())),
                null,
                null,
                Function.identity(),
                PostRecruitmentRequestSnippets.getCreateRequestFields(),
                CreatePostResponseSnippets.getCreatePostResponseFields()));
  }

  @Test
  @DisplayName("[updateRecruitmentPost] 구인글 수정 API 문서화")
  @WithAuthenticatedUser
  void updateRecruitmentPost() throws Exception {
    Long postId = 1L;
    UpdateRecruitmentPostRequest request = PostRecruitmentRequestSnippets.getUpdateRequest();
    doNothing().when(postRecruitmentService).updateRecruitmentPost(postId, request);

    mockMvc
        .perform(
            patch("/recruitment-posts/{postId}", postId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
        .andExpect(status().isNoContent())
        .andDo(
            document(
                "UpdateRecruitmentPost",
                ResourceSnippetParameters.builder()
                    .tag("recruitment-post")
                    .summary("구인글 수정")
                    .description("작성자가 구인글 본문과 메타데이터를 수정합니다.")
                    .requestSchema(schema(UpdateRecruitmentPostRequest.class.getSimpleName())),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("postId").description("게시글 ID")),
                PostRecruitmentRequestSnippets.getUpdateRequestFields()));
  }

  @Test
  @DisplayName("[updateRecruitmentStatus] 모집 상태 수정 API 문서화")
  @WithAuthenticatedUser
  void updateRecruitmentStatus() throws Exception {
    Long postId = 1L;
    UpdateRecruitmentStatusRequest request = PostRecruitmentRequestSnippets.getStatusRequest();
    doNothing()
        .when(postRecruitmentService)
        .updateRecruitmentStatus(postId, RecruitmentStatus.CLOSED);

    mockMvc
        .perform(
            patch("/recruitment-posts/{postId}/status", postId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
        .andExpect(status().isNoContent())
        .andDo(
            document(
                "UpdateRecruitmentStatus",
                ResourceSnippetParameters.builder()
                    .tag("recruitment-post")
                    .summary("모집 상태 변경")
                    .description("작성자가 구인글을 마감하거나 다시 엽니다.")
                    .requestSchema(schema(UpdateRecruitmentStatusRequest.class.getSimpleName())),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("postId").description("게시글 ID")),
                PostRecruitmentRequestSnippets.getStatusRequestFields()));
  }
}
