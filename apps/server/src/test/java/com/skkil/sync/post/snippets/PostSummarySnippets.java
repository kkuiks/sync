package com.skkil.sync.post.snippets;

import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;

import com.skkil.sync.common.util.restdocs.RestDocsUtils;
import com.skkil.sync.common.util.time.DateTimeTestUtils;
import com.skkil.sync.post.dto.response.GetPostResponse;
import com.skkil.sync.post.dto.summary.PostSummary;
import com.skkil.sync.post.model.EmploymentType;
import com.skkil.sync.post.model.ExperienceLevel;
import com.skkil.sync.post.model.PostScope;
import com.skkil.sync.post.model.PostStatus;
import com.skkil.sync.post.model.PostType;
import com.skkil.sync.post.model.RecruitmentStatus;
import com.skkil.sync.post.model.WorkMode;
import com.skkil.sync.post.security.PostAccessLevel;
import com.skkil.sync.project.snippets.ProjectSummarySnippets;
import com.skkil.sync.user.snippets.UserSummarySnippets;
import java.util.ArrayList;
import java.util.List;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.restdocs.payload.JsonFieldType;

public class PostSummarySnippets {

  public static PostSummary getPostSummary() {
    return getPostSummary(PostStatus.PUBLISHED);
  }

  public static PostSummary getPostSummary(PostStatus status) {
    return PostSummary.builder()
        .id(1L)
        .slug("test-slug")
        .title("Test Post Title")
        .type(PostType.SHORT)
        .status(status)
        .scope(PostScope.WORKSPACE)
        .accessLevel(PostAccessLevel.FULL)
        .author(UserSummarySnippets.getUserSummary())
        .project(ProjectSummarySnippets.getProjectSummary())
        .resolved(false)
        .isSeriesPost(false)
        .pinnedAt(null)
        .isAuthor(false)
        .canDelete(false)
        .canComment(true)
        .createdAt(DateTimeTestUtils.defaultTestOffsetDateTime())
        .updatedAt(DateTimeTestUtils.defaultTestOffsetDateTime())
        .likeCount(1L)
        .liked(true)
        .commentCount(1L)
        .bookmarked(true)
        .tags(List.of(TagSummarySnippets.getTagSummary()))
        .preview("This is a preview of the post content.")
        .previewMedia(
            List.of(
                GetPostResponse.Media.builder()
                    .id(1L)
                    .url("https://example.com/image.png")
                    .fileName("image.png")
                    .fileSize(102400L)
                    .mediaType("image/png")
                    .build()))
        .mediaCount(1)
        .wordCount(120)
        .coverImageUrl("https://example.com/cover.png")
        .createdViaClientName("Claude Code")
        .build();
  }

  public static List<FieldDescriptor> getPostSummaryFields(String prefix) {
    List<FieldDescriptor> fields = new ArrayList<>();
    fields.add(fieldWithPath(prefix + "id").type(JsonFieldType.NUMBER).description("Post ID"));
    fields.add(fieldWithPath(prefix + "slug").type(JsonFieldType.STRING).description("Post Slug"));
    fields.add(
        fieldWithPath(prefix + "title")
            .type(JsonFieldType.STRING)
            .description("Post Title")
            .optional());
    fields.add(
        fieldWithPath(prefix + "type")
            .type(RestDocsUtils.ENUM_TYPE)
            .description("Post Type")
            .attributes(RestDocsUtils.getEnumAttributes(PostType.class)));
    fields.add(
        fieldWithPath(prefix + "status")
            .type(RestDocsUtils.ENUM_TYPE)
            .description("Post Status")
            .attributes(RestDocsUtils.getEnumAttributes(PostStatus.class)));
    fields.add(
        fieldWithPath(prefix + "scope")
            .type(RestDocsUtils.ENUM_TYPE)
            .description("게시글 공개 범위")
            .attributes(RestDocsUtils.getEnumAttributes(PostScope.class)));
    fields.add(
        fieldWithPath(prefix + "accessLevel")
            .type(RestDocsUtils.ENUM_TYPE)
            .description("요청자의 열람 수준 (FULL: 본문까지 열람, PREVIEW: 유료 게이트로 본문 잠김)")
            .attributes(RestDocsUtils.getEnumAttributes(PostAccessLevel.class)));
    fields.add(fieldWithPath(prefix + "author").type(JsonFieldType.OBJECT).description("작성자 정보"));
    fields.addAll(UserSummarySnippets.getUserSummaryFields(prefix + "author."));
    fields.add(
        fieldWithPath(prefix + "project")
            .type(JsonFieldType.OBJECT)
            .description("소속 프로젝트 정보")
            .optional());
    ProjectSummarySnippets.getProjectSummaryFields(prefix + "project.").stream()
        .map(FieldDescriptor::optional)
        .forEach(fields::add);
    fields.add(
        fieldWithPath(prefix + "resolved")
            .type(JsonFieldType.BOOLEAN)
            .description("Whether the question post has been resolved"));
    fields.add(
        fieldWithPath(prefix + "isSeriesPost")
            .type(JsonFieldType.BOOLEAN)
            .description("게시글이 어떤 시리즈에 속해 있는지 여부"));
    fields.add(
        fieldWithPath(prefix + "pinnedAt")
            .type(JsonFieldType.STRING)
            .description("게시글이 프로젝트 대시보드에 고정된 시각 (고정되지 않은 경우 없음)")
            .optional());
    fields.add(
        fieldWithPath(prefix + "isAuthor")
            .type(JsonFieldType.BOOLEAN)
            .description("Whether the requesting user is the author of this post"));
    fields.add(
        fieldWithPath(prefix + "canDelete")
            .type(JsonFieldType.BOOLEAN)
            .description("요청자가 이 게시글을 삭제할 수 있는지 여부 (작성자, 플랫폼 관리자(개인 게시글), 프로젝트 관리자(프로젝트 게시글))"));
    fields.add(
        fieldWithPath(prefix + "canComment")
            .type(JsonFieldType.BOOLEAN)
            .description("요청자가 이 게시글에 댓글을 작성할 수 있는지 여부 (프로젝트 게시글은 팀원만 가능)"));
    fields.add(
        fieldWithPath(prefix + "createdAt")
            .type(JsonFieldType.STRING)
            .description("Creation Timestamp"));
    fields.add(
        fieldWithPath(prefix + "updatedAt")
            .type(JsonFieldType.STRING)
            .description("Last Updated Timestamp"));
    fields.add(
        fieldWithPath(prefix + "likeCount")
            .type(JsonFieldType.NUMBER)
            .description("Number of Likes"));
    fields.add(
        fieldWithPath(prefix + "liked")
            .type(JsonFieldType.BOOLEAN)
            .description("Whether the current user liked this post"));
    fields.add(
        fieldWithPath(prefix + "commentCount")
            .type(JsonFieldType.NUMBER)
            .description("Number of Comments"));
    fields.add(
        fieldWithPath(prefix + "bookmarked")
            .type(JsonFieldType.BOOLEAN)
            .description("Whether the current user bookmarked this post"));
    fields.add(
        fieldWithPath(prefix + "tags").type(JsonFieldType.ARRAY).description("게시물에 달린 태그 목록"));
    fields.addAll(TagSummarySnippets.getTagSummaryFields(prefix + "tags[]."));
    fields.add(
        fieldWithPath(prefix + "preview")
            .type(JsonFieldType.STRING)
            .description("게시물 내용의 일반 텍스트 미리보기"));
    fields.add(
        fieldWithPath(prefix + "previewMedia")
            .type(JsonFieldType.ARRAY)
            .description("미리보기용 첨부 이미지 목록 (최대 3개). 이미지가 아닌 첨부 파일은 포함되지 않는다"));
    fields.add(
        fieldWithPath(prefix + "previewMedia[].id")
            .type(JsonFieldType.NUMBER)
            .description("미디어 ID"));
    fields.add(
        fieldWithPath(prefix + "previewMedia[].url")
            .type(JsonFieldType.STRING)
            .description("미디어 URL"));
    fields.add(
        fieldWithPath(prefix + "previewMedia[].fileName")
            .type(JsonFieldType.STRING)
            .description("업로드된 원본 파일 이름"));
    fields.add(
        fieldWithPath(prefix + "previewMedia[].fileSize")
            .type(JsonFieldType.NUMBER)
            .description("파일 크기 (바이트)"));
    fields.add(
        fieldWithPath(prefix + "previewMedia[].mediaType")
            .type(JsonFieldType.STRING)
            .description("파일의 MIME 타입"));
    fields.add(
        fieldWithPath(prefix + "mediaCount")
            .type(JsonFieldType.NUMBER)
            .description("게시물에 첨부된 전체 미디어 수"));
    fields.add(
        fieldWithPath(prefix + "wordCount").type(JsonFieldType.NUMBER).description("게시물 본문의 단어 수"));
    fields.add(
        fieldWithPath(prefix + "coverImageUrl")
            .type(JsonFieldType.STRING)
            .description("게시물 커버 이미지 URL (없으면 없음)")
            .optional());
    fields.add(
        fieldWithPath(prefix + "recruitment")
            .type(JsonFieldType.OBJECT)
            .description("구인글 메타데이터 (일반 게시글에는 없음)")
            .optional());
    fields.add(
        fieldWithPath(prefix + "recruitment.status")
            .type(RestDocsUtils.ENUM_TYPE)
            .description("모집 상태")
            .attributes(RestDocsUtils.getEnumAttributes(RecruitmentStatus.class))
            .optional());
    fields.add(
        fieldWithPath(prefix + "recruitment.employmentType")
            .type(RestDocsUtils.ENUM_TYPE)
            .description("고용 형태")
            .attributes(RestDocsUtils.getEnumAttributes(EmploymentType.class))
            .optional());
    fields.add(
        fieldWithPath(prefix + "recruitment.workMode")
            .type(RestDocsUtils.ENUM_TYPE)
            .description("근무 방식")
            .attributes(RestDocsUtils.getEnumAttributes(WorkMode.class))
            .optional());
    fields.add(
        fieldWithPath(prefix + "recruitment.location")
            .type(JsonFieldType.STRING)
            .description("근무 지역")
            .optional());
    fields.add(
        fieldWithPath(prefix + "recruitment.experienceLevel")
            .type(RestDocsUtils.ENUM_TYPE)
            .description("경력 수준")
            .attributes(RestDocsUtils.getEnumAttributes(ExperienceLevel.class))
            .optional());
    fields.add(
        fieldWithPath(prefix + "recruitment.closesAt")
            .type(JsonFieldType.STRING)
            .description("모집 마감 시각")
            .optional());
    fields.add(
        fieldWithPath(prefix + "createdViaClientName")
            .type(JsonFieldType.STRING)
            .description("이 글을 만든 에이전트 클라이언트의 이름. 사람이 직접 쓴 글에는 없다")
            .optional());
    return fields;
  }
}
