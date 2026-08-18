package com.skkil.sync.post.dto.request;

import com.skkil.sync.post.model.RecruitmentStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateRecruitmentStatusRequest(@NotNull RecruitmentStatus status) {}
