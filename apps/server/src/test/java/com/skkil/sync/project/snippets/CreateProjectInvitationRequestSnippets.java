package com.skkil.sync.project.snippets;

import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.requestFields;

import com.skkil.sync.common.util.restdocs.RestDocsUtils;
import com.skkil.sync.project.dto.request.CreateProjectInvitationRequest;
import com.skkil.sync.project.model.Role;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.restdocs.payload.RequestFieldsSnippet;

public class CreateProjectInvitationRequestSnippets {

  public static CreateProjectInvitationRequest getCreateProjectInvitationRequest() {
    return new CreateProjectInvitationRequest("john-doe", Role.MEMBER);
  }

  public static RequestFieldsSnippet getCreateProjectInvitationRequestFields() {
    return requestFields(
        fieldWithPath("inviteeHandle").type(JsonFieldType.STRING).description("초대할 유저의 핸들"),
        fieldWithPath("role")
            .type(RestDocsUtils.ENUM_TYPE)
            .description("초대받는 유저의 역할")
            .attributes(RestDocsUtils.getEnumAttributes(Role.class)));
  }
}
