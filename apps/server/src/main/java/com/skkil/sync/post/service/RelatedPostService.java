package com.skkil.sync.post.service;

import com.skkil.sync.post.dto.data.PostDto;
import com.skkil.sync.post.dto.response.GetPostsResponse;
import com.skkil.sync.post.mapper.PostAssembler;
import com.skkil.sync.post.repository.PostEmbeddingRepository;
import com.skkil.sync.post.repository.PostQueryRepository;
import com.skkil.sync.post.repository.PostSearchRepository;
import java.util.List;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Vector;
import org.springframework.stereotype.Service;

@Service
public class RelatedPostService {

  private static final int RELATED_POST_COUNT = 5;

  private static final int CANDIDATE_POOL_SIZE = RELATED_POST_COUNT * 6;

  private final PostEmbeddingRepository postEmbeddingRepository;
  private final PostSearchRepository postSearchRepository;
  private final PostQueryRepository postQueryRepository;
  private final PostAssembler postAssembler;

  public RelatedPostService(
      PostEmbeddingRepository postEmbeddingRepository,
      PostSearchRepository postSearchRepository,
      PostQueryRepository postQueryRepository,
      PostAssembler postAssembler) {
    this.postEmbeddingRepository = postEmbeddingRepository;
    this.postSearchRepository = postSearchRepository;
    this.postQueryRepository = postQueryRepository;
    this.postAssembler = postAssembler;
  }

  public GetPostsResponse getRelatedPosts(@Nullable Long requesterId, Long postId) {
    var embedding = postEmbeddingRepository.findByPostId(postId);
    if (embedding.isEmpty()) {
      return new GetPostsResponse(List.of());
    }

    List<Long> candidateIds =
        postSearchRepository.findTopNRelatedByEmbedding(
            Vector.of(embedding.get().getEmbedding()), postId, CANDIDATE_POOL_SIZE);

    List<PostDto> topN =
        postQueryRepository.getPostsByIds(requesterId, candidateIds).stream()
            .limit(RELATED_POST_COUNT)
            .toList();

    return new GetPostsResponse(postAssembler.toPostResponses(topN, requesterId));
  }
}
