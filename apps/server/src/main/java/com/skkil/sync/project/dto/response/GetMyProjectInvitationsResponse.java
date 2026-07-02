package com.skkil.sync.project.dto.response;

import com.skkil.sync.project.model.Role;
import java.time.Instant;
import java.util.List;
import lombok.Builder;

public record GetMyProjectInvitationsResponse(List<Invitation> invitations) {

  @Builder
  public record Invitation(
      Long id,
      String token,
      String projectHandle,
      String projectName,
      String inviterHandle,
      String inviterName,
      Role role,
      Instant expiresAt) {}
}
