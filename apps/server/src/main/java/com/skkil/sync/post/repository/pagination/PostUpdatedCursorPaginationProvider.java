package com.skkil.sync.post.repository.pagination;

import static com.skkil.sync.jooq.tables.Posts.POSTS;

import com.skkil.sync.common.util.pagination.keyset.KeysetCursorPaginationProvider;
import com.skkil.sync.common.util.pagination.keyset.KeysetField;
import com.skkil.sync.post.dto.data.PostDto;
import com.skkil.sync.post.dto.data.PostUpdatedCursor;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class PostUpdatedCursorPaginationProvider
    extends KeysetCursorPaginationProvider<PostDto, PostUpdatedCursor> {

  @Override
  public Class<PostUpdatedCursor> getCursorClass() {
    return PostUpdatedCursor.class;
  }

  @Override
  protected List<KeysetField<PostUpdatedCursor, ?>> getKeysetFields() {
    return List.of(
        KeysetField.desc(POSTS.UPDATED_AT, PostUpdatedCursor::updatedAt),
        KeysetField.desc(POSTS.ID, PostUpdatedCursor::id));
  }

  @Override
  public PostUpdatedCursor convert(PostDto entity) {
    return new PostUpdatedCursor(entity.updatedAt(), entity.id());
  }
}
