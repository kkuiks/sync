package com.skkil.sync.user.snippets;

import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;

import com.skkil.sync.user.dto.response.SearchUsersResponse;
import java.util.List;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.restdocs.payload.ResponseFieldsSnippet;

public class SearchUsersResponseSnippets {

  public static SearchUsersResponse getSearchUsersResponse() {
    SearchUsersResponse.User user =
        SearchUsersResponse.User.builder()
            .handle("skkil")
            .name("스킬")
            .profileImageUrl("https://example.com/profile.png")
            .build();

    return new SearchUsersResponse(List.of(user));
  }

  public static ResponseFieldsSnippet getSearchUsersResponseFields() {
    return responseFields(
        fieldWithPath("users").type(JsonFieldType.ARRAY).description("사용자 목록"),
        fieldWithPath("users[].handle").type(JsonFieldType.STRING).description("사용자 핸들"),
        fieldWithPath("users[].name").type(JsonFieldType.STRING).description("사용자 이름"),
        fieldWithPath("users[].profileImageUrl")
            .type(JsonFieldType.STRING)
            .description("프로필 이미지 URL"));
  }
}
