package com.skkil.sync.project.model;

import com.skkil.sync.common.domain.BaseEntity;
import com.skkil.sync.project.constants.ProjectConstants;
import com.skkil.sync.user.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Builder;
import lombok.Getter;

@Entity
@Table(name = "project_invitations")
@Getter
public class ProjectInvitation extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "project_id", nullable = false)
  private Project project;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "inviter_id", nullable = false)
  private User inviter;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "invitee_id", nullable = false)
  private User invitee;

  @Column(name = "role", nullable = false)
  @Enumerated(EnumType.STRING)
  private Role role = Role.MEMBER;

  @Column(name = "status", nullable = false)
  @Enumerated(EnumType.STRING)
  private InvitationStatus status = InvitationStatus.PENDING;

  @Column(name = "token", nullable = false, unique = true)
  private String token;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  protected ProjectInvitation() {}

  @Builder
  public ProjectInvitation(Project project, User inviter, User invitee, Role role) {
    this.project = project;
    this.inviter = inviter;
    this.invitee = invitee;
    this.role = role;
    this.token = UUID.randomUUID().toString();
    this.expiresAt = Instant.now().plus(ProjectConstants.PROJECT_INVITATION_TTL);
  }

  public void accept() {
    this.status = InvitationStatus.ACCEPTED;
  }

  public void decline() {
    this.status = InvitationStatus.DECLINED;
  }

  public void expire() {
    this.status = InvitationStatus.EXPIRED;
  }

  public boolean isExpired() {
    return this.expiresAt.isBefore(Instant.now());
  }

  public boolean isPending() {
    return this.status == InvitationStatus.PENDING;
  }
}
