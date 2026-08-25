package com.skkil.sync.project.snippets;

import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;

import com.skkil.sync.common.util.restdocs.RestDocsUtils;
import com.skkil.sync.project.dto.summary.ProjectSummary;
import com.skkil.sync.project.model.JoinPolicy;
import java.time.Instant;
import java.util.List;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.restdocs.payload.JsonFieldType;

public class ProjectSummarySnippets {

  public static ProjectSummary getProjectSummary() {
    return ProjectSummary.builder()
        .handle("my-project")
        .name("나의 프로젝트")
        .description("프로젝트 설명")
        .website("https://example.com")
        .isPublic(true)
        .joinPolicy(JoinPolicy.INVITE)
        .followerCount(42)
        .iconUrl("https://example.com/icon.png")
        .rules("1. 서로 존중해주세요.\n2. 광고성 게시글은 금지합니다.")
        .createdAt(Instant.parse("2025-01-01T00:00:00Z"))
        .build();
  }

  public static List<FieldDescriptor> getProjectSummaryFields(String prefix) {
    return List.of(
        fieldWithPath(prefix + "handle").type(JsonFieldType.STRING).description("프로젝트 핸들"),
        fieldWithPath(prefix + "name").type(JsonFieldType.STRING).description("프로젝트 이름"),
        fieldWithPath(prefix + "description")
            .type(JsonFieldType.STRING)
            .optional()
            .description("프로젝트 설명"),
        fieldWithPath(prefix + "website")
            .type(JsonFieldType.STRING)
            .optional()
            .description("프로젝트 웹사이트"),
        fieldWithPath(prefix + "isPublic").type(JsonFieldType.BOOLEAN).description("공개 여부"),
        fieldWithPath(prefix + "joinPolicy")
            .type(RestDocsUtils.ENUM_TYPE)
            .description("프로젝트 참여 정책")
            .attributes(RestDocsUtils.getEnumAttributes(JoinPolicy.class)),
        fieldWithPath(prefix + "followerCount")
            .type(JsonFieldType.NUMBER)
            .description("프로젝트 팔로워 수"),
        fieldWithPath(prefix + "iconUrl")
            .type(JsonFieldType.STRING)
            .optional()
            .description("프로젝트 아이콘 URL"),
        fieldWithPath(prefix + "rules")
            .type(JsonFieldType.STRING)
            .optional()
            .description("프로젝트 규칙"),
        fieldWithPath(prefix + "createdAt").type(JsonFieldType.STRING).description("생성 시각"));
  }
}
