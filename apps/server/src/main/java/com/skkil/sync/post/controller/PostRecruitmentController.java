package com.skkil.sync.post.controller;

import com.skkil.sync.auth.AuthenticatedUser;
import com.skkil.sync.common.util.pagination.dto.request.CursorPaginationRequest;
import com.skkil.sync.post.dto.request.CreateRecruitmentPostRequest;
import com.skkil.sync.post.dto.request.UpdateRecruitmentPostRequest;
import com.skkil.sync.post.dto.request.UpdateRecruitmentStatusRequest;
import com.skkil.sync.post.dto.response.CreatePostResponse;
import com.skkil.sync.post.dto.response.PaginatedGetPostsResponse;
import com.skkil.sync.post.model.EmploymentType;
import com.skkil.sync.post.model.ExperienceLevel;
import com.skkil.sync.post.model.RecruitmentStatus;
import com.skkil.sync.post.model.WorkMode;
import com.skkil.sync.post.service.PostQueryService;
import com.skkil.sync.post.service.PostRecruitmentService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class PostRecruitmentController {

  private final PostRecruitmentService postRecruitmentService;
  private final PostQueryService postQueryService;

  public PostRecruitmentController(
      PostRecruitmentService postRecruitmentService, PostQueryService postQueryService) {
    this.postRecruitmentService = postRecruitmentService;
    this.postQueryService = postQueryService;
  }

  @GetMapping("/recruitment-posts")
  @ResponseStatus(HttpStatus.OK)
  public PaginatedGetPostsResponse getRecruitmentPosts(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestParam(required = false) RecruitmentStatus status,
      @RequestParam(required = false) EmploymentType employmentType,
      @RequestParam(required = false) WorkMode workMode,
      @RequestParam(required = false) ExperienceLevel experienceLevel,
      @RequestParam(required = false) String location,
      @RequestParam(required = false) String tag,
      @RequestParam(required = false) String query,
      @Validated CursorPaginationRequest pagination) {
    return postQueryService.getRecruitmentPosts(
        user.userId(),
        status,
        employmentType,
        workMode,
        experienceLevel,
        location,
        tag,
        query,
        pagination);
  }

  @PostMapping("/recruitment-posts")
  @ResponseStatus(HttpStatus.CREATED)
  public CreatePostResponse createRecruitmentPost(
      @AuthenticationPrincipal AuthenticatedUser user,
      @RequestBody @Validated CreateRecruitmentPostRequest request) {
    return postRecruitmentService.createRecruitmentPost(user.userId(), request);
  }

  @PatchMapping("/recruitment-posts/{postId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void updateRecruitmentPost(
      @PathVariable Long postId, @RequestBody @Validated UpdateRecruitmentPostRequest request) {
    postRecruitmentService.updateRecruitmentPost(postId, request);
  }

  @PatchMapping("/recruitment-posts/{postId}/status")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void updateRecruitmentStatus(
      @PathVariable Long postId, @RequestBody @Validated UpdateRecruitmentStatusRequest request) {
    postRecruitmentService.updateRecruitmentStatus(postId, request.status());
  }
}
