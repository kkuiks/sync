package com.skkil.sync.user.service;

import com.skkil.sync.media.service.domain.MediaDomainService;
import com.skkil.sync.user.dto.response.SearchUsersResponse;
import com.skkil.sync.user.mapper.UserSearchMapper;
import com.skkil.sync.user.model.User;
import com.skkil.sync.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserSearchService {

  private final UserRepository userRepository;

  private final MediaDomainService mediaDomainService;

  private final UserSearchMapper userSearchMapper;

  public UserSearchService(
      UserRepository userRepository,
      MediaDomainService mediaDomainService,
      UserSearchMapper userSearchMapper) {
    this.userRepository = userRepository;
    this.mediaDomainService = mediaDomainService;
    this.userSearchMapper = userSearchMapper;
  }

  @Transactional(readOnly = true)
  public SearchUsersResponse searchUsers(String query) {
    var users = userRepository.searchUsers(query);

    var profileImageUrls = mediaDomainService.generatePublicGetUrls(users, User::getProfileImage);

    var usersDto =
        users.stream()
            .map(user -> userSearchMapper.toSearchUsersResponseUser(user, profileImageUrls))
            .toList();

    return new SearchUsersResponse(usersDto);
  }
}
