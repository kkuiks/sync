package com.skkil.sync.project.snippets;

import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;

import com.skkil.sync.common.util.restdocs.RestDocsUtils;
import com.skkil.sync.project.dto.response.GetProjectInvitationsResponse;
import com.skkil.sync.project.model.Role;
import java.time.Instant;
import java.util.List;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.restdocs.payload.ResponseFieldsSnippet;

public class GetProjectInvitationsResponseSnippets {

  public static GetProjectInvitationsResponse getGetProjectInvitationsResponse() {
    return new GetProjectInvitationsResponse(
        List.of(
            GetProjectInvitationsResponse.Invitation.builder()
                .id(1L)
                .inviteeHandle("john-doe")
                .inviteeName("John Doe")
                .role(Role.MEMBER)
                .expiresAt(Instant.parse("2026-07-09T00:00:00Z"))
                .build()));
  }

  public static ResponseFieldsSnippet getGetProjectInvitationsResponseFields() {
    return responseFields(
        fieldWithPath("invitations").type(JsonFieldType.ARRAY).description("초대 목록"),
        fieldWithPath("invitations[].id").type(JsonFieldType.NUMBER).description("초대 ID"),
        fieldWithPath("invitations[].inviteeHandle")
            .type(JsonFieldType.STRING)
            .description("초대받은 유저의 핸들"),
        fieldWithPath("invitations[].inviteeName")
            .type(JsonFieldType.STRING)
            .description("초대받은 유저의 이름"),
        fieldWithPath("invitations[].role")
            .type(RestDocsUtils.ENUM_TYPE)
            .description("초대받은 유저의 역할")
            .attributes(RestDocsUtils.getEnumAttributes(Role.class)),
        fieldWithPath("invitations[].expiresAt")
            .type(JsonFieldType.STRING)
            .description("초대 만료 시각"));
  }
}
