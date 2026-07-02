package com.skkil.sync.user.dto.response;

import java.util.List;
import lombok.Builder;

public record SearchUsersResponse(List<User> users) {

  @Builder
  public record User(String handle, String name, String profileImageUrl) {}
}
