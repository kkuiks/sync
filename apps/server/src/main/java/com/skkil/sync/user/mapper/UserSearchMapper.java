package com.skkil.sync.user.mapper;

import com.skkil.sync.user.dto.response.SearchUsersResponse;
import com.skkil.sync.user.model.User;
import java.net.URL;
import java.util.Map;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserSearchMapper {

  default SearchUsersResponse.User toSearchUsersResponseUser(
      User user, Map<Long, URL> profileImageUrls) {
    var profileImage = user.getProfileImage();
    var url = profileImage != null ? profileImageUrls.get(profileImage.getId()) : null;
    return SearchUsersResponse.User.builder()
        .handle(user.getHandle())
        .name(user.getFullName())
        .profileImageUrl(url != null ? url.toString() : null)
        .build();
  }
}
