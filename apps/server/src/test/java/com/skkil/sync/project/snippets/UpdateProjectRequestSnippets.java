package com.skkil.sync.project.snippets;

import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.requestFields;

import com.skkil.sync.common.util.restdocs.RestDocsUtils;
import com.skkil.sync.project.dto.request.UpdateProjectRequest;
import com.skkil.sync.project.model.JoinPolicy;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.restdocs.payload.RequestFieldsSnippet;

public class UpdateProjectRequestSnippets {

  public static UpdateProjectRequest getUpdateProjectRequest() {
    return new UpdateProjectRequest(
        "프로젝트 설명입니다.",
        "https://example.com",
        null,
        null,
        "프로젝트 이름",
        "project-handle",
        JoinPolicy.REQUEST,
        "1. 서로 존중해주세요.");
  }

  public static RequestFieldsSnippet getUpdateProjectRequestFields() {
    return requestFields(
        fieldWithPath("description").type(JsonFieldType.STRING).optional().description("프로젝트 설명"),
        fieldWithPath("website").type(JsonFieldType.STRING).optional().description("프로젝트 웹사이트 URL"),
        fieldWithPath("iconMediaId")
            .type(JsonFieldType.STRING)
            .optional()
            .description("프로젝트 아이콘으로 설정할 미디어 ID"),
        fieldWithPath("removeIcon")
            .type(JsonFieldType.BOOLEAN)
            .optional()
            .description("프로젝트 아이콘 제거 여부"),
        fieldWithPath("name").type(JsonFieldType.STRING).optional().description("프로젝트 이름"),
        fieldWithPath("handle").type(JsonFieldType.STRING).optional().description("프로젝트 핸들"),
        fieldWithPath("joinPolicy")
            .type(RestDocsUtils.ENUM_TYPE)
            .optional()
            .description("프로젝트 참여 정책")
            .attributes(RestDocsUtils.getEnumAttributes(JoinPolicy.class)),
        fieldWithPath("rules").type(JsonFieldType.STRING).optional().description("프로젝트 규칙"));
  }
}
