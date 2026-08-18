package com.skkil.sync.post.dto.request;

import com.skkil.sync.post.model.EmploymentType;
import com.skkil.sync.post.model.ExperienceLevel;
import com.skkil.sync.post.model.RecruitmentStatus;
import com.skkil.sync.post.model.WorkMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;
import org.jspecify.annotations.Nullable;

public record UpdateRecruitmentPostRequest(
    @NotBlank @Size(max = 255) String title,
    @Valid @NotNull PostContentRequest content,
    List<String> tags,
    List<Long> referencedPostIds,
    @Nullable String coverMediaId,
    @Nullable Boolean removeCover,
    @NotNull RecruitmentStatus recruitmentStatus,
    @NotNull EmploymentType employmentType,
    @NotNull WorkMode workMode,
    @Size(max = 100) @Nullable String location,
    @NotNull ExperienceLevel experienceLevel,
    @Nullable OffsetDateTime closesAt) {}
