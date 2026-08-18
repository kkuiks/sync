package com.skkil.sync.post.service;

import com.skkil.sync.post.dto.request.CreateRecruitmentPostRequest;
import com.skkil.sync.post.dto.request.UpdateRecruitmentPostRequest;
import com.skkil.sync.post.dto.response.CreatePostResponse;
import com.skkil.sync.post.exception.PostNotFoundException;
import com.skkil.sync.post.model.Post;
import com.skkil.sync.post.model.PostRecruitment;
import com.skkil.sync.post.model.RecruitmentStatus;
import com.skkil.sync.post.repository.PostRecruitmentRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostRecruitmentService {

  private final PostService postService;
  private final PostRecruitmentRepository postRecruitmentRepository;

  public PostRecruitmentService(
      PostService postService, PostRecruitmentRepository postRecruitmentRepository) {
    this.postService = postService;
    this.postRecruitmentRepository = postRecruitmentRepository;
  }

  @Transactional
  public CreatePostResponse createRecruitmentPost(
      Long authorId, CreateRecruitmentPostRequest request) {
    Post post = postService.createRecruitmentPost(authorId, request);
    PostRecruitment recruitment =
        new PostRecruitment(
            post,
            request.employmentType(),
            request.workMode(),
            request.location(),
            request.experienceLevel(),
            request.closesAt());
    postRecruitmentRepository.save(recruitment);
    return new CreatePostResponse(post.getSlug());
  }

  @Transactional
  @PreAuthorize("hasPermission(#postId, 'POST', 'EDIT')")
  public void updateRecruitmentPost(Long postId, UpdateRecruitmentPostRequest request) {
    PostRecruitment recruitment = getRecruitment(postId);
    postService.updateRecruitmentPostContent(postId, request);
    recruitment.update(
        request.recruitmentStatus(),
        request.employmentType(),
        request.workMode(),
        request.location(),
        request.experienceLevel(),
        request.closesAt());
  }

  @Transactional
  @PreAuthorize("hasPermission(#postId, 'POST', 'EDIT')")
  public void updateRecruitmentStatus(Long postId, RecruitmentStatus status) {
    getRecruitment(postId).updateStatus(status);
  }

  private PostRecruitment getRecruitment(Long postId) {
    return postRecruitmentRepository
        .findById(postId)
        .orElseThrow(() -> new PostNotFoundException(postId));
  }
}
