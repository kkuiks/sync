package com.skkil.sync.project.dto.request;

import com.skkil.sync.project.model.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateProjectInvitationRequest(@NotBlank String inviteeHandle, @NotNull Role role) {}
