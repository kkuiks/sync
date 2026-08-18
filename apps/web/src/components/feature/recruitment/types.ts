export enum RecruitmentStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
  FREELANCE_PROJECT = 'FREELANCE_PROJECT',
}

export enum WorkMode {
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
  ONSITE = 'ONSITE',
}

export enum ExperienceLevel {
  ANY = 'ANY',
  ENTRY = 'ENTRY',
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
}

export interface RecruitmentDetails {
  status: RecruitmentStatus;
  employmentType: EmploymentType;
  workMode: WorkMode;
  location?: string | null;
  experienceLevel: ExperienceLevel;
  closesAt?: string | null;
}

export interface RecruitmentFormValue {
  employmentType: EmploymentType;
  workMode: WorkMode;
  location: string;
  experienceLevel: ExperienceLevel;
  closesAt: string;
}

export const DEFAULT_RECRUITMENT_FORM_VALUE: RecruitmentFormValue = {
  employmentType: EmploymentType.FULL_TIME,
  workMode: WorkMode.REMOTE,
  location: '',
  experienceLevel: ExperienceLevel.ANY,
  closesAt: '',
};
