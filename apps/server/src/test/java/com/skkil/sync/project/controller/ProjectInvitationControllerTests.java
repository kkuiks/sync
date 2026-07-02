package com.skkil.sync.project.controller;

import static com.epages.restdocs.apispec.MockMvcRestDocumentationWrapper.document;
import static com.epages.restdocs.apispec.Schema.schema;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.epages.restdocs.apispec.ResourceSnippetParameters;
import com.skkil.sync.common.config.TestSecurityConfig;
import com.skkil.sync.common.security.WithAuthenticatedUser;
import com.skkil.sync.config.SecurityConfig;
import com.skkil.sync.project.dto.request.CreateProjectInvitationRequest;
import com.skkil.sync.project.dto.response.GetMyProjectInvitationsResponse;
import com.skkil.sync.project.dto.response.GetProjectInvitationsResponse;
import com.skkil.sync.project.service.ProjectInvitationService;
import com.skkil.sync.project.snippets.CreateProjectInvitationRequestSnippets;
import com.skkil.sync.project.snippets.GetMyProjectInvitationsResponseSnippets;
import com.skkil.sync.project.snippets.GetProjectInvitationsResponseSnippets;
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

@WebMvcTest(ProjectInvitationController.class)
@AutoConfigureMockMvc(addFilters = false)
@AutoConfigureRestDocs
@ExtendWith(RestDocumentationExtension.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
class ProjectInvitationControllerTests {

  @Autowired private MockMvc mockMvc;

  @Autowired private JsonMapper jsonMapper;

  @MockitoBean private ProjectInvitationService projectInvitationService;

  @Test
  @DisplayName("[createInvitation] API 문서화 테스트")
  @WithAuthenticatedUser
  void createInvitation() throws Exception {
    String projectHandle = "my-project";
    CreateProjectInvitationRequest request =
        CreateProjectInvitationRequestSnippets.getCreateProjectInvitationRequest();

    doNothing()
        .when(projectInvitationService)
        .createInvitation(anyLong(), eq(projectHandle), eq(request));

    mockMvc
        .perform(
            post("/projects/{handle}/invitations", projectHandle)
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
        .andExpect(status().isCreated())
        .andDo(
            document(
                "CreateProjectInvitation",
                ResourceSnippetParameters.builder()
                    .tag("project")
                    .summary("Create Project Invitation")
                    .description("프로젝트에 팀원을 초대합니다.")
                    .requestSchema(schema(CreateProjectInvitationRequest.class.getSimpleName())),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("handle").description("프로젝트 핸들")),
                CreateProjectInvitationRequestSnippets.getCreateProjectInvitationRequestFields()));
  }

  @Test
  @DisplayName("[getProjectInvitations] API 문서화 테스트")
  @WithAuthenticatedUser
  void getProjectInvitations() throws Exception {
    String projectHandle = "my-project";
    GetProjectInvitationsResponse response =
        GetProjectInvitationsResponseSnippets.getGetProjectInvitationsResponse();

    when(projectInvitationService.getProjectInvitations(projectHandle)).thenReturn(response);

    mockMvc
        .perform(get("/projects/{handle}/invitations", projectHandle))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetProjectInvitations",
                ResourceSnippetParameters.builder()
                    .tag("project")
                    .summary("Get Project Invitations")
                    .description("프로젝트의 대기 중인 초대 목록을 조회합니다.")
                    .responseSchema(schema(GetProjectInvitationsResponse.class.getSimpleName())),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("handle").description("프로젝트 핸들")),
                GetProjectInvitationsResponseSnippets.getGetProjectInvitationsResponseFields()));
  }

  @Test
  @DisplayName("[cancelInvitation] API 문서화 테스트")
  @WithAuthenticatedUser
  void cancelInvitation() throws Exception {
    String projectHandle = "my-project";
    Long invitationId = 1L;

    doNothing().when(projectInvitationService).cancelInvitation(projectHandle, invitationId);

    mockMvc
        .perform(
            delete("/projects/{handle}/invitations/{invitationId}", projectHandle, invitationId))
        .andExpect(status().isNoContent())
        .andDo(
            document(
                "CancelProjectInvitation",
                ResourceSnippetParameters.builder()
                    .tag("project")
                    .summary("Cancel Project Invitation")
                    .description("프로젝트 초대를 취소합니다."),
                null,
                null,
                Function.identity(),
                pathParameters(
                    parameterWithName("handle").description("프로젝트 핸들"),
                    parameterWithName("invitationId").description("초대 ID"))));
  }

  @Test
  @DisplayName("[getMyInvitations] API 문서화 테스트")
  @WithAuthenticatedUser
  void getMyInvitations() throws Exception {
    GetMyProjectInvitationsResponse response =
        GetMyProjectInvitationsResponseSnippets.getGetMyProjectInvitationsResponse();

    when(projectInvitationService.getMyInvitations(anyLong())).thenReturn(response);

    mockMvc
        .perform(get("/invitations"))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetMyProjectInvitations",
                ResourceSnippetParameters.builder()
                    .tag("project")
                    .summary("Get My Project Invitations")
                    .description("내가 받은 대기 중인 프로젝트 초대 목록을 조회합니다.")
                    .responseSchema(schema(GetMyProjectInvitationsResponse.class.getSimpleName())),
                null,
                null,
                Function.identity(),
                GetMyProjectInvitationsResponseSnippets
                    .getGetMyProjectInvitationsResponseFields()));
  }

  @Test
  @DisplayName("[acceptInvitation] API 문서화 테스트")
  @WithAuthenticatedUser
  void acceptInvitation() throws Exception {
    String token = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

    doNothing().when(projectInvitationService).acceptInvitation(anyLong(), eq(token));

    mockMvc
        .perform(post("/invitations/{token}/accept", token))
        .andExpect(status().isNoContent())
        .andDo(
            document(
                "AcceptProjectInvitation",
                ResourceSnippetParameters.builder()
                    .tag("project")
                    .summary("Accept Project Invitation")
                    .description("프로젝트 초대를 수락합니다."),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("token").description("초대 토큰"))));
  }

  @Test
  @DisplayName("[declineInvitation] API 문서화 테스트")
  @WithAuthenticatedUser
  void declineInvitation() throws Exception {
    String token = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

    doNothing().when(projectInvitationService).declineInvitation(anyLong(), eq(token));

    mockMvc
        .perform(post("/invitations/{token}/decline", token))
        .andExpect(status().isNoContent())
        .andDo(
            document(
                "DeclineProjectInvitation",
                ResourceSnippetParameters.builder()
                    .tag("project")
                    .summary("Decline Project Invitation")
                    .description("프로젝트 초대를 거절합니다."),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("token").description("초대 토큰"))));
  }
}
