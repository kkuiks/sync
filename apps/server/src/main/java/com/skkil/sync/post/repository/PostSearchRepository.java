package com.skkil.sync.post.repository;

import com.skkil.sync.post.model.PostEmbedding;
import java.util.List;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Limit;
import org.springframework.data.domain.SearchResults;
import org.springframework.data.domain.Vector;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

public interface PostSearchRepository extends Repository<PostEmbedding, Long> {

  SearchResults<PostEmbedding> findByEmbeddingNear(Vector embedding, Limit limit);

  @Query(
      value =
          """
          SELECT pe.post_id FROM post_embeddings pe
          JOIN posts p ON p.id = pe.post_id
          LEFT JOIN projects pr ON pr.id = p.project_id
          WHERE p.visibility = 'VISIBLE'
          AND p.status = 'PUBLISHED'
          AND NOT EXISTS (SELECT 1 FROM post_recruitments r WHERE r.post_id = p.id)
          AND ((:projectHandle IS NULL AND p.project_id IS NULL)
            OR (:projectHandle IS NOT NULL AND p.project_id IS NOT NULL AND pr.handle = :projectHandle))
          ORDER BY pe.embedding <=> :embedding
          LIMIT :n
          """,
      nativeQuery = true)
  List<Long> findTopNByEmbeddingNearAndProjectHandle(
      @Param("embedding") Vector embedding,
      @Param("projectHandle") @Nullable String projectHandle,
      int n);

  @Query(
      value =
          """
          SELECT r.id FROM posts r
          LEFT JOIN projects pr ON pr.id = r.project_id
          WHERE r.visibility = 'VISIBLE'
          AND r.status = 'PUBLISHED'
          AND NOT EXISTS (SELECT 1 FROM post_recruitments recruitment WHERE recruitment.post_id = r.id)
          AND ((:projectHandle IS NULL AND r.project_id IS NULL)
            OR (:projectHandle IS NOT NULL AND r.project_id IS NOT NULL AND pr.handle = :projectHandle))
          AND NOT EXISTS (
            SELECT 1 FROM unnest(regexp_split_to_array(trim(:query), '\\s+')) AS term
            WHERE r.title NOT ILIKE '%' || term || '%' AND r.content NOT ILIKE '%' || term || '%'
          )
          ORDER BY GREATEST(similarity(r.title, :query), similarity(r.content, :query)) DESC
          LIMIT :n
          """,
      nativeQuery = true)
  List<Long> findTopNByFullTextSearch(
      @Param("query") String query, @Param("projectHandle") @Nullable String projectHandle, int n);

  @Query(
      value =
          """
          SELECT pe.post_id FROM post_embeddings pe
          JOIN posts p ON p.id = pe.post_id
          WHERE p.visibility = 'VISIBLE'
          AND p.status = 'PUBLISHED'
          AND NOT EXISTS (SELECT 1 FROM post_recruitments r WHERE r.post_id = p.id)
          AND pe.post_id <> :postId
          ORDER BY pe.embedding <=> :embedding
          LIMIT :n
          """,
      nativeQuery = true)
  List<Long> findTopNRelatedByEmbedding(
      @Param("embedding") Vector embedding, @Param("postId") Long postId, int n);
}
