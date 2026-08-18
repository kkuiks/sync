package com.skkil.sync.post.controller;

import static com.epages.restdocs.apispec.MockMvcRestDocumentationWrapper.document;
import static com.epages.restdocs.apispec.Schema.schema;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.restdocs.request.RequestDocumentation.parameterWithName;
import static org.springframework.restdocs.request.RequestDocumentation.pathParameters;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.epages.restdocs.apispec.ResourceSnippetParameters;
import com.skkil.sync.common.config.TestSecurityConfig;
import com.skkil.sync.config.SecurityConfig;
import com.skkil.sync.post.dto.response.GetPostsResponse;
import com.skkil.sync.post.service.RelatedPostService;
import com.skkil.sync.post.snippets.GetPostsResponseSnippets;
import java.util.function.Function;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.restdocs.test.autoconfigure.AutoConfigureRestDocs;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.restdocs.RestDocumentationExtension;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(RelatedPostController.class)
@AutoConfigureMockMvc(addFilters = true)
@AutoConfigureRestDocs
@ExtendWith(RestDocumentationExtension.class)
@Import({SecurityConfig.class, TestSecurityConfig.class})
class RelatedPostControllerTests {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private RelatedPostService relatedPostService;

  @Test
  @DisplayName("[getRelatedPosts] API 문서화 테스트")
  void getRelatedPosts() throws Exception {
    Long postId = 1L;
    GetPostsResponse response = GetPostsResponseSnippets.getGetPostsResponse();

    when(relatedPostService.getRelatedPosts(any(), eq(postId))).thenReturn(response);

    mockMvc
        .perform(get("/posts/{postId}/related", postId))
        .andExpect(status().isOk())
        .andDo(
            document(
                "GetRelatedPosts",
                ResourceSnippetParameters.builder()
                    .tag("post")
                    .summary("Get Related Posts")
                    .description("주어진 게시글과 임베딩상 유사한 관련 게시글을 최대 N개 추천한다")
                    .responseSchema(schema("GetPostsResponse")),
                null,
                null,
                Function.identity(),
                pathParameters(parameterWithName("postId").description("기준 게시글 ID")),
                GetPostsResponseSnippets.getPostsResponseFields()));
  }
}
