package com.skkil.sync.project.security;

import com.skkil.sync.auth.AuthenticatedUser;
import com.skkil.sync.common.security.CustomPermissionEvaluator;
import com.skkil.sync.common.security.PermissionOperation;
import com.skkil.sync.common.security.enums.PermissionEvaluatorType;
import com.skkil.sync.project.repository.TeammateRepository;
import org.springframework.stereotype.Component;

@Component
public class ProjectPermissionEvaluator implements CustomPermissionEvaluator<String> {

  private final TeammateRepository teammateRepository;

  public ProjectPermissionEvaluator(TeammateRepository teammateRepository) {
    this.teammateRepository = teammateRepository;
  }

  @Override
  public PermissionEvaluatorType type() {
    return PermissionEvaluatorType.PROJECT;
  }

  @Override
  public boolean hasPermission(
      AuthenticatedUser user, String projectHandle, PermissionOperation permission) {
    if (user == null) {
      return false;
    }

    return switch (permission) {
      case READ ->
          teammateRepository.findByProjectHandleAndUserId(projectHandle, user.userId()).isPresent();
      case CREATE, EDIT, DELETE ->
          teammateRepository.existsByProjectHandleAndUserIdAndIsOwnerTrue(
              projectHandle, user.userId());
    };
  }
}
