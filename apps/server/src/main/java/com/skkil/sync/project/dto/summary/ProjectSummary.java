package com.skkil.sync.project.dto.summary;

import com.skkil.sync.project.model.JoinPolicy;
import java.time.Instant;
import lombok.Builder;

@Builder
public record ProjectSummary(
    String handle,
    String name,
    String description,
    String website,
    boolean isPublic,
    JoinPolicy joinPolicy,
    long followerCount,
    String iconUrl,
    String rules,
    Instant createdAt) {}
