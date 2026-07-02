package com.skkil.sync.project.controller;

import com.skkil.sync.auth.AuthenticatedUser;
import com.skkil.sync.project.dto.request.CreateProjectInvitationRequest;
import com.skkil.sync.project.dto.response.GetMyProjectInvitationsResponse;
import com.skkil.sync.project.dto.response.GetProjectInvitationsResponse;
import com.skkil.sync.project.service.ProjectInvitationService;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class ProjectInvitationController {

  private final ProjectInvitationService projectInvitationService;

  public ProjectInvitationController(ProjectInvitationService projectInvitationService) {
    this.projectInvitationService = projectInvitationService;
  }

  @PostMapping("/projects/{handle}/invitations")
  @ResponseStatus(HttpStatus.CREATED)
  public void createInvitation(
      @AuthenticationPrincipal @NotNull AuthenticatedUser user,
      @PathVariable String handle,
      @RequestBody @Validated CreateProjectInvitationRequest request) {
    projectInvitationService.createInvitation(user.userId(), handle, request);
  }

  @GetMapping("/projects/{handle}/invitations")
  @ResponseStatus(HttpStatus.OK)
  public GetProjectInvitationsResponse getProjectInvitations(@PathVariable String handle) {
    return projectInvitationService.getProjectInvitations(handle);
  }

  @DeleteMapping("/projects/{handle}/invitations/{invitationId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void cancelInvitation(@PathVariable String handle, @PathVariable Long invitationId) {
    projectInvitationService.cancelInvitation(handle, invitationId);
  }

  @GetMapping("/invitations")
  @ResponseStatus(HttpStatus.OK)
  public GetMyProjectInvitationsResponse getMyInvitations(
      @AuthenticationPrincipal @NotNull AuthenticatedUser user) {
    return projectInvitationService.getMyInvitations(user.userId());
  }

  @PostMapping("/invitations/{token}/accept")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void acceptInvitation(
      @AuthenticationPrincipal @NotNull AuthenticatedUser user, @PathVariable String token) {
    projectInvitationService.acceptInvitation(user.userId(), token);
  }

  @PostMapping("/invitations/{token}/decline")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void declineInvitation(
      @AuthenticationPrincipal @NotNull AuthenticatedUser user, @PathVariable String token) {
    projectInvitationService.declineInvitation(user.userId(), token);
  }
}
