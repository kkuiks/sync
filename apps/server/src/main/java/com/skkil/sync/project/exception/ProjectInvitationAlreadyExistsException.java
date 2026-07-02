package com.skkil.sync.project.exception;

import com.skkil.sync.common.exception.ErrorCode;
import com.skkil.sync.common.exception.SyncException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

public class ProjectInvitationAlreadyExistsException extends SyncException {

  public ProjectInvitationAlreadyExistsException() {
    super("A pending invitation already exists for this recipient.");
  }

  @Override
  public HttpStatusCode getStatusCode() {
    return HttpStatus.CONFLICT;
  }

  @Override
  public ErrorCode getErrorCode() {
    return ErrorCode.PROJECT_INVITATION_ALREADY_EXISTS;
  }
}
