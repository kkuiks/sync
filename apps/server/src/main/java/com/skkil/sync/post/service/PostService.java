package com.skkil.sync.post.service;

import com.skkil.sync.media.model.Media;
import com.skkil.sync.post.dto.request.CreatePostRequest;
import com.skkil.sync.post.dto.request.UpdatePostRequest;
import com.skkil.sync.post.dto.request.UpdatePostSummaryRequest;
import com.skkil.sync.post.dto.response.CreatePostResponse;
import com.skkil.sync.post.event.PostContentChangedEvent;
import com.skkil.sync.post.event.PostPublishedEvent;
import com.skkil.sync.post.exception.PostNotFoundException;
import com.skkil.sync.post.model.Post;
import com.skkil.sync.post.model.PostStatus;
import com.skkil.sync.post.repository.PostRepository;
import com.skkil.sync.post.util.PostSlugGenerator;
import com.skkil.sync.post.validator.PostRequestValidator;
import com.skkil.sync.project.model.Project;
import com.skkil.sync.project.service.ProjectDomainService;
import com.skkil.sync.user.model.User;
import com.skkil.sync.user.service.domain.UserDomainService;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PostService {

  private final UserDomainService userDomainService;
  private final ProjectDomainService projectDomainService;

  private final TagService tagService;
  private final PostContentMediaService contentMediaService;
  private final ApplicationEventPublisher eventPublisher;

  private final PostRepository postRepository;

  public PostService(
      UserDomainService userDomainService,
      ProjectDomainService projectDomainService,
      TagService tagService,
      PostContentMediaService contentMediaService,
      PostRepository postRepository,
      ApplicationEventPublisher eventPublisher) {
    this.userDomainService = userDomainService;
    this.projectDomainService = projectDomainService;
    this.tagService = tagService;
    this.contentMediaService = contentMediaService;
    this.postRepository = postRepository;
    this.eventPublisher = eventPublisher;
  }

  @Transactional
  public CreatePostResponse createPost(Long authorId, CreatePostRequest request) {
    PostStatus status = request.status() == null ? PostStatus.PUBLISHED : request.status();
    PostRequestValidator.validateCreate(request, status);

    User author = userDomainService.getUserReference(authorId);
    String slug = PostSlugGenerator.generate(author, request);

    List<Media> mediaFiles =
        contentMediaService.resolveMediaFilesForCreate(authorId, request.content().mediaIds());

    Post post = buildPost(author, slug, status, request);

    post = postRepository.save(post);
    contentMediaService.replaceMediaFiles(post, mediaFiles);

    applyPublishSideEffects(post, false, request.content().text());

    return new CreatePostResponse(post.getSlug());
  }

  private Post buildPost(User author, String slug, PostStatus status, CreatePostRequest request) {
    Post.PostBuilder postBuilder =
        Post.builder()
            .slug(slug)
            .author(author)
            .type(request.type())
            .status(status)
            .title(request.title())
            .content(request.content().json());

    Project project = null;
    if (request.project() != null) {
      project = projectDomainService.getProjectByHandle(request.project().handle());
      postBuilder.project(project);
    }

    Post post = postBuilder.build();
    tagService.addTagsToPost(post, project, request.tags());

    return post;
  }

  @Transactional
  @PreAuthorize("hasPermission(#postId, 'POST', 'EDIT')")
  public void updatePost(Long postId, UpdatePostRequest request) {
    Post post =
        postRepository.findById(postId).orElseThrow(() -> new PostNotFoundException(postId));

    PostRequestValidator.validateUpdate(request);
    PostRequestValidator.validateStatusTransition(post, request.status());
    boolean wasPublished = post.isPublished();

    List<Media> mediaFiles =
        contentMediaService.resolveMediaFilesForUpdate(
            post.getAuthor().getId(), post.getId(), request.content().mediaIds());

    post.update(request.title(), request.type(), request.status(), request.content().json());
    tagService.replaceTags(post, request.tags());
    contentMediaService.replaceMediaFiles(post, mediaFiles);

    applyPublishSideEffects(post, wasPublished, request.content().text());
  }

  /**
   * Publishes the events that follow from a post becoming published (activity count) or having its
   * content changed while published and public (summary/embedding refresh), for both creation and
   * update.
   */
  private void applyPublishSideEffects(Post post, boolean wasPublished, String contentText) {
    if (!wasPublished && post.isPublished()) {
      eventPublisher.publishEvent(
          new PostPublishedEvent(
              post.getId(),
              post.getAuthor().getId(),
              LocalDate.ofInstant(post.getCreatedAt(), ZoneId.systemDefault())));
    }

    if (post.isPublished() && post.isPublic()) {
      eventPublisher.publishEvent(new PostContentChangedEvent(post.getId(), contentText));
    }
  }

  @Transactional
  @PreAuthorize("hasPermission(#postId, 'POST', 'EDIT')")
  public void updatePostSummary(Long postId, UpdatePostSummaryRequest request) {
    Post post =
        postRepository.findById(postId).orElseThrow(() -> new PostNotFoundException(postId));

    post.updateSummary(request.summary());
  }

  @Transactional
  @PreAuthorize("hasPermission(#postId, 'POST', 'DELETE')")
  public void deletePost(Long postId) {
    if (!postRepository.existsById(postId)) {
      throw new PostNotFoundException(postId);
    }

    postRepository.deleteById(postId);
  }
}
