package com.skkil.sync.project.dto.response;

import com.skkil.sync.project.model.Role;
import java.time.Instant;
import java.util.List;
import lombok.Builder;

public record GetProjectInvitationsResponse(List<Invitation> invitations) {

  @Builder
  public record Invitation(
      Long id, String inviteeHandle, String inviteeName, Role role, Instant expiresAt) {}
}
