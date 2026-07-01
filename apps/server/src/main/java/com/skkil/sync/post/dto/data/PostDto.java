package com.skkil.sync.post.dto.data;

import com.skkil.sync.post.model.PostScope;
import com.skkil.sync.post.model.PostStatus;
import com.skkil.sync.post.model.PostType;
import java.time.OffsetDateTime;
import org.jspecify.annotations.Nullable;

public record PostDto(
    Long id,
    PostType type,
    PostScope scope,
    PostStatus status,
    String slug,
    @Nullable String title,
    Long authorId,
    String authorName,
    String authorHandle,
    @Nullable String projectHandle,
    @Nullable String projectName,
    String content,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    Long likeCount,
    Long commentCount,
    Boolean bookmarked) {}
