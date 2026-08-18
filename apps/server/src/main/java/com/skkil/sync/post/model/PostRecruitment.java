package com.skkil.sync.post.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.jspecify.annotations.Nullable;

@Entity
@Table(name = "post_recruitments")
@Getter
public class PostRecruitment {

  @Id
  @Column(name = "post_id")
  private Long postId;

  @MapsId
  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "post_id")
  private Post post;

  @Column(name = "status", nullable = false)
  @Enumerated(EnumType.STRING)
  private RecruitmentStatus status = RecruitmentStatus.OPEN;

  @Column(name = "employment_type", nullable = false)
  @Enumerated(EnumType.STRING)
  private EmploymentType employmentType;

  @Column(name = "work_mode", nullable = false)
  @Enumerated(EnumType.STRING)
  private WorkMode workMode;

  @Column(name = "location")
  private @Nullable String location;

  @Column(name = "experience_level", nullable = false)
  @Enumerated(EnumType.STRING)
  private ExperienceLevel experienceLevel;

  @Column(name = "closes_at")
  private @Nullable OffsetDateTime closesAt;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private OffsetDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  protected PostRecruitment() {}

  public PostRecruitment(
      Post post,
      EmploymentType employmentType,
      WorkMode workMode,
      @Nullable String location,
      ExperienceLevel experienceLevel,
      @Nullable OffsetDateTime closesAt) {
    this.post = post;
    this.employmentType = employmentType;
    this.workMode = workMode;
    this.location = normalizeLocation(location);
    this.experienceLevel = experienceLevel;
    this.closesAt = closesAt;
  }

  public void update(
      RecruitmentStatus status,
      EmploymentType employmentType,
      WorkMode workMode,
      @Nullable String location,
      ExperienceLevel experienceLevel,
      @Nullable OffsetDateTime closesAt) {
    this.status = status;
    this.employmentType = employmentType;
    this.workMode = workMode;
    this.location = normalizeLocation(location);
    this.experienceLevel = experienceLevel;
    this.closesAt = closesAt;
  }

  public void updateStatus(RecruitmentStatus status) {
    this.status = status;
  }

  private static @Nullable String normalizeLocation(@Nullable String location) {
    if (location == null || location.isBlank()) {
      return null;
    }
    return location.trim();
  }
}
