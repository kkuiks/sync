package com.skkil.sync.user.controller;

import static com.epages.restdocs.apispec.MockMvcRestDocumentationWrapper.document;
import static com.epages.restdocs.apispec.Schema.schema;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.modifyHeaders;
import static org.springframework.restdocs.operation.preprocess.Preprocessors.preprocessRequest;
import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.requestFields;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.epages.restdocs.apispec.ResourceSnippetParameters;
import com.skkil.sync.auth.AuthenticatedUser;
import com.skkil.sync.common.config.TestSecurityConfig;
import com.skkil.sync.common.security.WithAuthenticatedUser;
import com.skkil.sync.config.SecurityConfig;
import com.skkil.sync.user.constant.Role;
import com.skkil.sync.user.dto.request.LoginRequest;
import com.skkil.sync.user.dto.request.RegisterRequest;
import com.skkil.sync.user.service.AuthService;
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
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = true)
@AutoConfigureRestDocs
@ExtendWith(RestDocumentationExtension.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
class AuthControllerTests {

  @Autowired private MockMvc mockMvc;

  @Autowired private JsonMapper jsonMapper;

  @MockitoBean private AuthService authService;

  @Test
  @DisplayName("[getCsrfToken] API 문서화 테스트")
  void getCsrfToken() throws Exception {
    mockMvc
        .perform(get("/csrf"))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetCsrfToken",
                ResourceSnippetParameters.builder()
                    .tag("auth")
                    .summary("Get CSRF Token")
                    .description("CSRF 토큰을 쿠키로 발급하고 요청 헤더 정보를 반환합니다.")
                    .responseSchema(schema("CsrfToken")),
                null,
                null,
                Function.identity(),
                responseFields(
                    fieldWithPath("headerName")
                        .type(JsonFieldType.STRING)
                        .description("CSRF 토큰 요청 헤더 이름"),
                    fieldWithPath("parameterName")
                        .type(JsonFieldType.STRING)
                        .description("CSRF 토큰 요청 파라미터 이름"),
                    fieldWithPath("token").type(JsonFieldType.STRING).description("CSRF 토큰 값"))));
  }

  @Test
  @DisplayName("[login] API 문서화 테스트")
  void login() throws Exception {
    LoginRequest request = new LoginRequest("user@example.com", "password123");

    AuthenticatedUser user =
        new AuthenticatedUser(1L, "user", "user@example.com", "hashedPassword", Role.USER);
    Authentication authentication =
        new UsernamePasswordAuthenticationToken(user, request.password(), user.getAuthorities());

    when(authService.authenticate(any(LoginRequest.class))).thenReturn(authentication);

    mockMvc
        .perform(
            post("/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
        .andExpect(status().isNoContent())
        .andDo(
            document(
                "Login",
                ResourceSnippetParameters.builder()
                    .tag("auth")
                    .summary("Login")
                    .description("Login")
                    .requestSchema(schema(LoginRequest.class.getSimpleName())),
                preprocessRequest(modifyHeaders().set("Content-Type", "application/json")),
                null,
                Function.identity(),
                requestFields(
                    fieldWithPath("email").type(JsonFieldType.STRING).description("Email"),
                    fieldWithPath("password").type(JsonFieldType.STRING).description("Password"))));
  }

  @Test
  @DisplayName("[logout] API 문서화 테스트")
  @WithAuthenticatedUser
  void logout() throws Exception {
    mockMvc
        .perform(post("/auth/logout").with(csrf()).contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isNoContent())
        .andDo(
            document(
                "Logout",
                ResourceSnippetParameters.builder()
                    .tag("auth")
                    .summary("Logout")
                    .description("Logout"),
                preprocessRequest(modifyHeaders().set("Content-Type", "application/json")),
                null,
                Function.identity()));
  }

  @Test
  @DisplayName("[register] API 문서화 테스트")
  void register() throws Exception {
    RegisterRequest request = new RegisterRequest("newuser@example.com", "password123");

    mockMvc
        .perform(
            post("/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
        .andExpect(status().isNoContent())
        .andDo(
            document(
                "Register",
                ResourceSnippetParameters.builder()
                    .tag("auth")
                    .summary("Register")
                    .description("Register")
                    .requestSchema(schema(RegisterRequest.class.getSimpleName())),
                preprocessRequest(modifyHeaders().set("Content-Type", "application/json")),
                null,
                Function.identity(),
                requestFields(
                    fieldWithPath("email").type(JsonFieldType.STRING).description("Email"),
                    fieldWithPath("password").type(JsonFieldType.STRING).description("Password"))));
  }

  @Test
  void register_passwordIsBad_returnBadRequest() throws Exception {
    RegisterRequest request = new RegisterRequest("user@example.com", "short");

    mockMvc
        .perform(
            post("/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }
}
