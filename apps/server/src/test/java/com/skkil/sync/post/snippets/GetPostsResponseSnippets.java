package com.skkil.sync.post.snippets;

import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;

import com.skkil.sync.post.dto.response.GetPostsResponse;
import java.util.ArrayList;
import java.util.List;
import org.springframework.restdocs.payload.FieldDescriptor;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.restdocs.payload.ResponseFieldsSnippet;

/**
 * 페이지네이션 없는 게시글 목록 응답({@link GetPostsResponse})의 공통 스니펫. 여러 엔드포인트가 같은 스키마를 공유하므로 예시 객체와 필드 설명을 공통으로
 * 사용한다.
 */
public class GetPostsResponseSnippets {

  public static GetPostsResponse getGetPostsResponse() {
    return new GetPostsResponse(List.of(PostSummarySnippets.getPostSummary()));
  }

  public static ResponseFieldsSnippet getPostsResponseFields() {
    List<FieldDescriptor> fields = new ArrayList<>();
    fields.add(fieldWithPath("posts").type(JsonFieldType.ARRAY).description("게시글 목록"));
    fields.addAll(PostSummarySnippets.getPostSummaryFields("posts[]."));

    return responseFields(fields.toArray(new FieldDescriptor[0]));
  }
}
