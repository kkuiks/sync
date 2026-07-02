package com.skkil.sync.common.security;

import com.skkil.sync.auth.AuthenticatedUser;
import com.skkil.sync.common.security.enums.PermissionEvaluatorType;
import java.io.Serializable;

public interface CustomPermissionEvaluator<T extends Serializable> {

  PermissionEvaluatorType type();

  boolean hasPermission(AuthenticatedUser user, T targetId, PermissionOperation permission);
}
