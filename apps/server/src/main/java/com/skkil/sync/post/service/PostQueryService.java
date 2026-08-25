package com.skkil.sync.post.service;

import com.skkil.sync.common.util.pagination.dto.request.CursorPaginationRequest;
import com.skkil.sync.common.util.pagination.interfaces.CursorPaginationDataFetcher;
import com.skkil.sync.common.util.pagination.interfaces.CursorPaginationProvider;
import com.skkil.sync.common.util.pagination.model.Cursor;
import com.skkil.sync.common.util.pagination.service.PaginationService;
import com.skkil.sync.post.dto.data.PostDto;
import com.skkil.sync.post.dto.response.GetPostResponse;
import com.skkil.sync.post.dto.response.GetPostsResponse;
import com.skkil.sync.post.dto.response.PaginatedGetPostsResponse;
import com.skkil.sync.post.exception.PostNotFoundException;
import com.skkil.sync.post.mapper.PostAssembler;
import com.skkil.sync.post.model.EmploymentType;
import com.skkil.sync.post.model.ExperienceLevel;
import com.skkil.sync.post.model.PostScope;
import com.skkil.sync.post.model.PostType;
import com.skkil.sync.post.model.RecruitmentStatus;
import com.skkil.sync.post.model.WorkMode;
import com.skkil.sync.post.repository.PostQueryRepository;
import com.skkil.sync.post.repository.pagination.CommentedPostCursorPaginationProvider;
import com.skkil.sync.post.repository.pagination.PostCursorPaginationProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class PostQueryService {

  private final PostQueryRepository postQueryRepository;
  private final PostContentMediaService contentMediaService;
  private final PostAssembler postAssembler;

  private final PaginationService paginationService;
  private final PostCursorPaginationProvider paginationProvider;
  private final CommentedPostCursorPaginationProvider commentedPostPaginationProvider;

  public PostQueryService(
      PostQueryRepository postQueryRepository,
      PostContentMediaService contentMediaService,
      PostAssembler postAssembler,
      PostCursorPaginationProvider paginationProvider,
      CommentedPostCursorPaginationProvider commentedPostPaginationProvider,
      PaginationService paginationService) {
    this.postQueryRepository = postQueryRepository;
    this.contentMediaService = contentMediaService;
    this.postAssembler = postAssembler;
    this.paginationProvider = paginationProvider;
    this.commentedPostPaginationProvider = commentedPostPaginationProvider;
    this.paginationService = paginationService;
  }

  @Transactional(readOnly = true)
  public PaginatedGetPostsResponse getPosts(Long requesterId, CursorPaginationRequest pagination) {
    return getPostsResponse(requesterId, postQueryRepository.getPosts(requesterId), pagination);
  }

  @Transactional(readOnly = true)
  public PaginatedGetPostsResponse getRecruitmentPosts(
      Long requesterId,
      RecruitmentStatus status,
      EmploymentType employmentType,
      WorkMode workMode,
      ExperienceLevel experienceLevel,
      String location,
      String tag,
      String query,
      CursorPaginationRequest pagination) {
    return getPostsResponse(
        requesterId,
        postQueryRepository.getRecruitmentPosts(
            requesterId, status, employmentType, workMode, experienceLevel, location, tag, query),
        pagination);
  }

  @Transactional(readOnly = true)
  public GetPostResponse getPostBySlug(Long requesterId, String slug) {
    var post =
        postQueryRepository
            .getPostBySlug(requesterId, slug)
            .orElseThrow(() -> new PostNotFoundException(slug));

    var media = contentMediaService.getMediaFilesForPost(post.id());

    return postAssembler.toGetPostResponse(post, media, requesterId);
  }

  /**
   * 게시글이 가리키는 참조(forward reference) 목록을 조회한다. 대상 게시글을 열람할 수 없으면 404 로 존재 자체를 숨긴다. 참조 대상의 열람 가능 여부는
   * 저장소 쿼리에서 걸러진다.
   */
  @Transactional(readOnly = true)
  public GetPostsResponse getPostReferences(Long requesterId, String slug) {
    var source =
        postQueryRepository
            .getPostBySlug(requesterId, slug)
            .orElseThrow(() -> new PostNotFoundException(slug));

    var referenced = postQueryRepository.getReferencedPosts(requesterId, source.id());

    return new GetPostsResponse(postAssembler.toPostResponses(referenced, requesterId));
  }

  /** 이 게시글을 가리키는(역참조, backlink) 게시글 목록을 커서 페이지네이션으로 조회한다. */
  @Transactional(readOnly = true)
  public PaginatedGetPostsResponse getPostBacklinks(
      Long requesterId, String slug, CursorPaginationRequest pagination) {
    var target =
        postQueryRepository
            .getPostBySlug(requesterId, slug)
            .orElseThrow(() -> new PostNotFoundException(slug));

    return getPostsResponse(
        requesterId, postQueryRepository.getBacklinkPosts(requesterId, target.id()), pagination);
  }

  @Transactional(readOnly = true)
  @PreAuthorize("#projectHandle == null or hasPermission(#projectHandle, 'PROJECT', 'READ')")
  public PaginatedGetPostsResponse getDrafts(
      Long requesterId,
      PostType type,
      PostScope scope,
      String projectHandle,
      CursorPaginationRequest pagination) {
    return getPostsResponse(
        requesterId,
        postQueryRepository.getDraftsByAuthor(requesterId, type, scope, projectHandle),
        pagination);
  }

  @Transactional(readOnly = true)
  @PreAuthorize("hasPermission(#userId, 'PROFILE', 'READ')")
  public PaginatedGetPostsResponse getUserPosts(
      Long requesterId, Long userId, PostType type, CursorPaginationRequest pagination) {
    return getPostsResponse(
        requesterId, postQueryRepository.getPostsByUser(requesterId, userId, type), pagination);
  }

  @Transactional(readOnly = true)
  @PreAuthorize("hasPermission(#tagId, 'TAG', 'READ')")
  public PaginatedGetPostsResponse getPostsByTag(
      Long requesterId, Long tagId, PostType type, CursorPaginationRequest pagination) {
    return getPostsResponse(
        requesterId, postQueryRepository.getPostsByTag(requesterId, tagId, type), pagination);
  }

  @Transactional(readOnly = true)
  @PreAuthorize("hasPermission(#handle, 'PROJECT', 'READ')")
  public PaginatedGetPostsResponse getPostsByProject(
      Long requesterId,
      String handle,
      PostType type,
      String authorHandle,
      CursorPaginationRequest pagination) {
    return getPostsResponse(
        requesterId,
        postQueryRepository.getPostsByProject(requesterId, handle, type, authorHandle),
        pagination);
  }

  @Transactional(readOnly = true)
  @PreAuthorize("hasPermission(#handle, 'PROJECT', 'READ')")
  public GetPostsResponse getPinnedPostsByProject(Long requesterId, String handle) {
    var pinned = postQueryRepository.getPinnedPostsByProject(requesterId, handle);
    return new GetPostsResponse(postAssembler.toPostResponses(pinned, requesterId));
  }

  @Transactional(readOnly = true)
  @PreAuthorize("hasPermission(#handle, 'PROJECT', 'READ')")
  public GetPostsResponse getTopPostsByProject(Long requesterId, String handle) {
    var topPosts = postQueryRepository.getTopPostsByProject(requesterId, handle);
    return new GetPostsResponse(postAssembler.toPostResponses(topPosts, requesterId));
  }

  @Transactional(readOnly = true)
  @PreAuthorize("hasPermission(#handle, 'PROJECT', 'READ')")
  public GetPostsResponse getUnansweredQuestionsByProject(Long requesterId, String handle) {
    var unanswered = postQueryRepository.getUnansweredQuestionsByProject(requesterId, handle);
    return new GetPostsResponse(postAssembler.toPostResponses(unanswered, requesterId));
  }

  @Transactional(readOnly = true)
  @PreAuthorize("hasPermission(#userId, 'PROFILE', 'READ')")
  public PaginatedGetPostsResponse getCommentedPosts(
      Long requesterId, Long userId, String projectHandle, CursorPaginationRequest pagination) {
    return getPostsResponse(
        requesterId,
        postQueryRepository.getCommentedPosts(userId, projectHandle),
        commentedPostPaginationProvider,
        pagination);
  }

  private PaginatedGetPostsResponse getPostsResponse(
      Long requesterId,
      CursorPaginationDataFetcher<PostDto> fetcher,
      CursorPaginationRequest pagination) {
    return getPostsResponse(requesterId, fetcher, paginationProvider, pagination);
  }

  private <C extends Cursor> PaginatedGetPostsResponse getPostsResponse(
      Long requesterId,
      CursorPaginationDataFetcher<PostDto> fetcher,
      CursorPaginationProvider<PostDto, C> provider,
      CursorPaginationRequest pagination) {
    var page = paginationService.paginate(fetcher, provider, pagination);
    var posts = postAssembler.toPostResponses(page, requesterId);

    return new PaginatedGetPostsResponse(posts);
  }
}
