package com.skkil.sync.post.dto.request;

import com.skkil.sync.post.model.PostStatus;
import com.skkil.sync.post.model.PostType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UpdatePostRequest(
    String title,
    @NotNull PostType type,
    @NotNull PostStatus status,
    @Valid @NotNull Content content,
    List<String> tags) {

  public static record Content(@NotBlank String text, @NotBlank String json, List<Long> mediaIds) {}
}
