package com.skkil.sync.project.mapper;

import com.skkil.sync.project.dto.response.GetMyProjectInvitationsResponse;
import com.skkil.sync.project.dto.response.GetProjectInvitationsResponse;
import com.skkil.sync.project.model.ProjectInvitation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProjectInvitationMapper {

  @Mapping(target = "inviteeHandle", source = "invitee.handle")
  @Mapping(target = "inviteeName", source = "invitee.fullName")
  GetProjectInvitationsResponse.Invitation toGetProjectInvitationsResponseInvitation(
      ProjectInvitation invitation);

  @Mapping(target = "projectHandle", source = "project.handle")
  @Mapping(target = "projectName", source = "project.name")
  @Mapping(target = "inviterHandle", source = "inviter.handle")
  @Mapping(target = "inviterName", source = "inviter.fullName")
  GetMyProjectInvitationsResponse.Invitation toGetMyProjectInvitationsResponseInvitation(
      ProjectInvitation invitation);
}
