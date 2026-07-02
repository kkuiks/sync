package com.skkil.sync.user.snippets;

import static org.springframework.restdocs.payload.PayloadDocumentation.fieldWithPath;
import static org.springframework.restdocs.payload.PayloadDocumentation.responseFields;

import com.skkil.sync.user.dto.response.GetHandleAvailabilityResponse;
import org.springframework.restdocs.payload.JsonFieldType;
import org.springframework.restdocs.payload.ResponseFieldsSnippet;

public class GetHandleAvailabilityResponseSnippets {

  public static GetHandleAvailabilityResponse getGetHandleAvailabilityResponse() {
    return new GetHandleAvailabilityResponse(true);
  }

  public static ResponseFieldsSnippet getResponseFields() {
    return responseFields(
        fieldWithPath("available").type(JsonFieldType.BOOLEAN).description("핸들 사용 가능 여부"));
  }
}
