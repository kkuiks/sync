'use client';

import { useTranslations } from 'next-intl';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { toLocalDateTimeInputValue } from './dateTime';
import {
  EmploymentType,
  ExperienceLevel,
  type RecruitmentFormValue,
  WorkMode,
} from './types';

export { toOptionalIsoDateTime } from './dateTime';

interface RecruitmentFieldsProps {
  value: RecruitmentFormValue;
  onChange: (value: RecruitmentFormValue) => void;
}

export function RecruitmentFields({ value, onChange }: RecruitmentFieldsProps) {
  const t = useTranslations('pages.recruitment');

  return (
    <section className="flex flex-col gap-4">
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('editor.details')}
      </h3>

      <div className="space-y-2">
        <Label htmlFor="recruitment-employment-type">
          {t('fields.employment-type')}
        </Label>
        <Select
          value={value.employmentType}
          onValueChange={(next) =>
            onChange({
              ...value,
              employmentType: next as EmploymentType,
            })
          }
        >
          <SelectTrigger id="recruitment-employment-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(EmploymentType).map((item) => (
              <SelectItem key={item} value={item}>
                {t(`employment-types.${item}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recruitment-work-mode">{t('fields.work-mode')}</Label>
        <Select
          value={value.workMode}
          onValueChange={(next) =>
            onChange({ ...value, workMode: next as WorkMode })
          }
        >
          <SelectTrigger id="recruitment-work-mode" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(WorkMode).map((item) => (
              <SelectItem key={item} value={item}>
                {t(`work-modes.${item}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recruitment-location">{t('fields.location')}</Label>
        <Input
          id="recruitment-location"
          value={value.location}
          maxLength={100}
          placeholder={t('fields.location-placeholder')}
          onChange={(event) =>
            onChange({ ...value, location: event.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recruitment-experience-level">
          {t('fields.experience-level')}
        </Label>
        <Select
          value={value.experienceLevel}
          onValueChange={(next) =>
            onChange({
              ...value,
              experienceLevel: next as ExperienceLevel,
            })
          }
        >
          <SelectTrigger id="recruitment-experience-level" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(ExperienceLevel).map((item) => (
              <SelectItem key={item} value={item}>
                {t(`experience-levels.${item}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recruitment-closes-at">{t('fields.closes-at')}</Label>
        <Input
          id="recruitment-closes-at"
          type="datetime-local"
          value={value.closesAt}
          onChange={(event) =>
            onChange({ ...value, closesAt: event.target.value })
          }
        />
        <p className="text-xs text-muted-foreground">
          {t('fields.closes-at-description')}
        </p>
      </div>
    </section>
  );
}

export function toRecruitmentFormValue(
  details:
    | {
        employmentType: EmploymentType;
        workMode: WorkMode;
        location?: string | null;
        experienceLevel: ExperienceLevel;
        closesAt?: string | null;
      }
    | null
    | undefined,
): RecruitmentFormValue {
  if (!details) {
    return {
      employmentType: EmploymentType.FULL_TIME,
      workMode: WorkMode.REMOTE,
      location: '',
      experienceLevel: ExperienceLevel.ANY,
      closesAt: '',
    };
  }

  return {
    employmentType: details.employmentType,
    workMode: details.workMode,
    location: details.location ?? '',
    experienceLevel: details.experienceLevel,
    closesAt: details.closesAt
      ? toLocalDateTimeInputValue(details.closesAt)
      : '',
  };
}
