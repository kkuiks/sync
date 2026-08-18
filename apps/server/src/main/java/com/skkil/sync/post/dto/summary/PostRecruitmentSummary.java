package com.skkil.sync.post.dto.summary;

import com.skkil.sync.post.model.EmploymentType;
import com.skkil.sync.post.model.ExperienceLevel;
import com.skkil.sync.post.model.RecruitmentStatus;
import com.skkil.sync.post.model.WorkMode;
import java.time.OffsetDateTime;
import org.jspecify.annotations.Nullable;

public record PostRecruitmentSummary(
    RecruitmentStatus status,
    EmploymentType employmentType,
    WorkMode workMode,
    @Nullable String location,
    ExperienceLevel experienceLevel,
    @Nullable OffsetDateTime closesAt) {}
