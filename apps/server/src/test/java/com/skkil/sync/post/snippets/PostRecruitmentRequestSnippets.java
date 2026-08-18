package com.skkil.sync.post.snippets;

import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.requestFields;

import com.skkil.sync.common.util.restdocs.RestDocsUtils;
import com.skkil.sync.post.dto.request.CreateRecruitmentPostRequest;
import com.skkil.sync.post.dto.request.PostContentRequest;
import com.skkil.sync.post.dto.request.UpdateRecruitmentPostRequest;
import com.skkil.sync.post.dto.request.UpdateRecruitmentStatusRequest;
import com.skkil.sync.post.model.EmploymentType;
import com.skkil.sync.post.model.ExperienceLevel;
import com.skkil.sync.post.model.RecruitmentStatus;
import com.skkil.sync.post.model.WorkMode;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.restdocs.payload.RequestFieldsSnippet;

public final class PostRecruitmentRequestSnippets {

  private PostRecruitmentRequestSnippets() {}

  public static CreateRecruitmentPostRequest getCreateRequest() {
    return new CreateRecruitmentPostRequest(
        "백엔드 엔지니어를 모집합니다",
        content(),
        List.of("java", "spring"),
        List.of(10L),
        "100",
        EmploymentType.FULL_TIME,
        WorkMode.HYBRID,
        "서울",
        ExperienceLevel.MID,
        OffsetDateTime.parse("2026-09-30T23:59:59+09:00"));
  }

  public static UpdateRecruitmentPostRequest getUpdateRequest() {
    return new UpdateRecruitmentPostRequest(
        "백엔드 엔지니어를 모집합니다",
        content(),
        List.of("java", "spring"),
        List.of(10L),
        "100",
        false,
        RecruitmentStatus.OPEN,
        EmploymentType.FULL_TIME,
        WorkMode.HYBRID,
        "서울",
        ExperienceLevel.MID,
        OffsetDateTime.parse("2026-09-30T23:59:59+09:00"));
  }

  public static UpdateRecruitmentStatusRequest getStatusRequest() {
    return new UpdateRecruitmentStatusRequest(RecruitmentStatus.CLOSED);
  }

  public static RequestFieldsSnippet getCreateRequestFields() {
    return requestFields(commonFields(false));
  }

  public static RequestFieldsSnippet getUpdateRequestFields() {
    return requestFields(commonFields(true));
  }

  public static RequestFieldsSnippet getStatusRequestFields() {
    return requestFields(
        fieldWithPath("status")
            .type(RestDocsUtils.ENUM_TYPE)
            .description("변경할 모집 상태")
            .attributes(RestDocsUtils.getEnumAttributes(RecruitmentStatus.class)));
  }

  private static org.springframework.restdocs.payload.FieldDescriptor[] commonFields(
      boolean update) {
    List<org.springframework.restdocs.payload.FieldDescriptor> fields =
        new java.util.ArrayList<>(
            List.of(
                fieldWithPath("title").type(JsonFieldType.STRING).description("모집 제목"),
                fieldWithPath("content").type(JsonFieldType.OBJECT).description("모집 내용"),
                fieldWithPath("content.text").type(JsonFieldType.STRING).description("본문 텍스트"),
                fieldWithPath("content.json")
                    .type(JsonFieldType.STRING)
                    .description("Tiptap JSON 본문"),
                fieldWithPath("content.mediaIds")
                    .type(JsonFieldType.ARRAY)
                    .description("본문에서 사용한 미디어 ID 목록")
                    .optional(),
                fieldWithPath("tags").type(JsonFieldType.ARRAY).description("기술 태그 목록").optional(),
                fieldWithPath("referencedPostIds")
                    .type(JsonFieldType.ARRAY)
                    .description("참조 게시글 ID 목록")
                    .optional(),
                fieldWithPath("coverMediaId")
                    .type(JsonFieldType.STRING)
                    .description("커버 이미지 미디어 ID")
                    .optional(),
                fieldWithPath("employmentType")
                    .type(RestDocsUtils.ENUM_TYPE)
                    .description("고용 형태")
                    .attributes(RestDocsUtils.getEnumAttributes(EmploymentType.class)),
                fieldWithPath("workMode")
                    .type(RestDocsUtils.ENUM_TYPE)
                    .description("근무 방식")
                    .attributes(RestDocsUtils.getEnumAttributes(WorkMode.class)),
                fieldWithPath("location")
                    .type(JsonFieldType.STRING)
                    .description("근무 지역")
                    .optional(),
                fieldWithPath("experienceLevel")
                    .type(RestDocsUtils.ENUM_TYPE)
                    .description("경력 수준")
                    .attributes(RestDocsUtils.getEnumAttributes(ExperienceLevel.class)),
                fieldWithPath("closesAt")
                    .type(JsonFieldType.STRING)
                    .description("모집 마감 시각")
                    .optional()));

    if (update) {
      fields.add(
          fieldWithPath("removeCover")
              .type(JsonFieldType.BOOLEAN)
              .description("기존 커버 삭제 여부")
              .optional());
      fields.add(
          fieldWithPath("recruitmentStatus")
              .type(RestDocsUtils.ENUM_TYPE)
              .description("모집 상태")
              .attributes(RestDocsUtils.getEnumAttributes(RecruitmentStatus.class)));
    }

    return fields.toArray(org.springframework.restdocs.payload.FieldDescriptor[]::new);
  }

  private static PostContentRequest content() {
    return new PostContentRequest(
        "업무와 자격 요건, 보상 및 지원 방법입니다.", "{\"type\":\"doc\",\"content\":[]}", List.of());
  }
}
