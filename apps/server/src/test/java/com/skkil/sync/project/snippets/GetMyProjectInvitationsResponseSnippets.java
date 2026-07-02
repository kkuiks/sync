package com.skkil.sync.project.snippets;

import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;

import com.skkil.sync.common.util.restdocs.RestDocsUtils;
import com.skkil.sync.project.dto.response.GetMyProjectInvitationsResponse;
import com.skkil.sync.project.model.Role;
import java.time.Instant;
import java.util.List;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.restdocs.payload.ResponseFieldsSnippet;

public class GetMyProjectInvitationsResponseSnippets {

  public static GetMyProjectInvitationsResponse getGetMyProjectInvitationsResponse() {
    return new GetMyProjectInvitationsResponse(
        List.of(
            GetMyProjectInvitationsResponse.Invitation.builder()
                .id(1L)
                .token("f47ac10b-58cc-4372-a567-0e02b2c3d479")
                .projectHandle("my-project")
                .projectName("My Project")
                .inviterHandle("jane-doe")
                .inviterName("Jane Doe")
                .role(Role.MEMBER)
                .expiresAt(Instant.parse("2026-07-09T00:00:00Z"))
                .build()));
  }

  public static ResponseFieldsSnippet getGetMyProjectInvitationsResponseFields() {
    return responseFields(
        fieldWithPath("invitations").type(JsonFieldType.ARRAY).description("초대 목록"),
        fieldWithPath("invitations[].id").type(JsonFieldType.NUMBER).description("초대 ID"),
        fieldWithPath("invitations[].token").type(JsonFieldType.STRING).description("초대 토큰"),
        fieldWithPath("invitations[].projectHandle")
            .type(JsonFieldType.STRING)
            .description("프로젝트 핸들"),
        fieldWithPath("invitations[].projectName")
            .type(JsonFieldType.STRING)
            .description("프로젝트 이름"),
        fieldWithPath("invitations[].inviterHandle")
            .type(JsonFieldType.STRING)
            .description("초대한 유저의 핸들"),
        fieldWithPath("invitations[].inviterName")
            .type(JsonFieldType.STRING)
            .description("초대한 유저의 이름"),
        fieldWithPath("invitations[].role")
            .type(RestDocsUtils.ENUM_TYPE)
            .description("초대받는 역할")
            .attributes(RestDocsUtils.getEnumAttributes(Role.class)),
        fieldWithPath("invitations[].expiresAt")
            .type(JsonFieldType.STRING)
            .description("초대 만료 시각"));
  }
}
