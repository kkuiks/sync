package com.skkil.sync.post.dto.data;

import com.skkil.sync.common.util.pagination.model.Cursor;
import java.time.OffsetDateTime;
import java.util.Map;

public record PostUpdatedCursor(OffsetDateTime updatedAt, Long id) implements Cursor {

  @Override
  public Map<String, String> getFields() {
    return Map.of(
        "updatedAt", updatedAt.toString(),
        "id", id.toString());
  }
}
