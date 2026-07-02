package com.skkil.sync.user.controller;

import com.skkil.sync.user.dto.response.SearchUsersResponse;
import com.skkil.sync.user.service.UserSearchService;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
public class UserSearchController {

  private final UserSearchService userSearchService;

  public UserSearchController(UserSearchService userSearchService) {
    this.userSearchService = userSearchService;
  }

  @GetMapping("/search/users")
  @ResponseStatus(HttpStatus.OK)
  public SearchUsersResponse searchUsers(@RequestParam(required = true) String query) {
    return userSearchService.searchUsers(query);
  }
}
