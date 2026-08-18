'use client';

import { MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { useDebounce } from '@uidotdev/usehooks';
import { useTranslations } from 'next-intl';

import { useSearchTags } from '@/api/__generated__/tag/tag';
import type { GetTagsResponseTagsItem } from '@/api/__generated__/types/GetTagsResponseTagsItem';
import { TagBadge } from '@/components/feature/tag/TagBadge';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

import {
  EmploymentType,
  ExperienceLevel,
  RecruitmentStatus,
  WorkMode,
} from './types';

const TAG_SEARCH_DEBOUNCE_MS = 300;

export interface RecruitmentFiltersValue {
  status: RecruitmentStatus | 'ALL';
  employmentType: EmploymentType | 'ALL';
  workMode: WorkMode | 'ALL';
  experienceLevel: ExperienceLevel | 'ALL';
  location: string;
  tag: string;
  query: string;
}

export const DEFAULT_RECRUITMENT_FILTERS: RecruitmentFiltersValue = {
  status: RecruitmentStatus.OPEN,
  employmentType: 'ALL',
  workMode: 'ALL',
  experienceLevel: 'ALL',
  location: '',
  tag: '',
  query: '',
};

export function RecruitmentFilters({
  value,
  onChange,
}: {
  value: RecruitmentFiltersValue;
  onChange: (value: RecruitmentFiltersValue) => void;
}) {
  const t = useTranslations('pages.recruitment');
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="relative md:col-span-2">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            value={value.query}
            placeholder={t('filters.query-placeholder')}
            onChange={(event) =>
              onChange({ ...value, query: event.target.value })
            }
          />
        </div>
        <Input
          value={value.location}
          placeholder={t('filters.location-placeholder')}
          onChange={(event) =>
            onChange({ ...value, location: event.target.value })
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterSelect
          value={value.status}
          allLabel={t('filters.all-statuses')}
          items={Object.values(RecruitmentStatus)}
          getLabel={(item) => t(`statuses.${item}`)}
          onChange={(next) =>
            onChange({
              ...value,
              status: next as RecruitmentStatus | 'ALL',
            })
          }
        />
        <FilterSelect
          value={value.employmentType}
          allLabel={t('filters.all-employment-types')}
          items={Object.values(EmploymentType)}
          getLabel={(item) => t(`employment-types.${item}`)}
          onChange={(next) =>
            onChange({
              ...value,
              employmentType: next as EmploymentType | 'ALL',
            })
          }
        />
        <FilterSelect
          value={value.workMode}
          allLabel={t('filters.all-work-modes')}
          items={Object.values(WorkMode)}
          getLabel={(item) => t(`work-modes.${item}`)}
          onChange={(next) =>
            onChange({ ...value, workMode: next as WorkMode | 'ALL' })
          }
        />
        <FilterSelect
          value={value.experienceLevel}
          allLabel={t('filters.all-experience-levels')}
          items={Object.values(ExperienceLevel)}
          getLabel={(item) => t(`experience-levels.${item}`)}
          onChange={(next) =>
            onChange({
              ...value,
              experienceLevel: next as ExperienceLevel | 'ALL',
            })
          }
        />
        <RecruitmentTagFilter
          value={value.tag}
          onChange={(tag) => onChange({ ...value, tag })}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(DEFAULT_RECRUITMENT_FILTERS)}
        >
          <XIcon />
          {t('filters.reset')}
        </Button>
      </div>
    </div>
  );
}

function RecruitmentTagFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations('pages.recruitment.filters');
  const debouncedQuery = useDebounce(value.trim(), TAG_SEARCH_DEBOUNCE_MS);
  const hasQuery = debouncedQuery.length > 0;
  const { data, isFetching } = useSearchTags(
    { query: debouncedQuery },
    { query: { enabled: hasQuery } },
  );
  const isPending = value.trim() !== debouncedQuery || isFetching;
  const searchedTags = (data?.data.tags ?? []).filter(
    (tag) => tag.projectHandle == null,
  );
  const tags = isPending ? [] : searchedTags;
  const selectedTag =
    searchedTags.find((tag) => tag.name === value.trim()) ?? null;

  return (
    <Combobox<GetTagsResponseTagsItem>
      items={tags}
      value={selectedTag}
      inputValue={value}
      onInputValueChange={(next, eventDetails) => {
        if (eventDetails.reason !== 'item-press') {
          onChange(next);
        }
      }}
      onValueChange={(tag) => onChange(tag?.name ?? '')}
      itemToStringLabel={(tag) => tag.name}
      isItemEqualToValue={(item, selected) => item.id === selected.id}
      autoComplete="off"
      autoHighlight
      filter={null}
    >
      <ComboboxInput
        className="w-64"
        placeholder={t('tag-placeholder')}
        aria-label={t('tag-label')}
        showTrigger={false}
        showClear={value.length > 0}
      />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxCollection>
            {(tag: GetTagsResponseTagsItem) => (
              <ComboboxItem key={tag.id} value={tag}>
                <TagBadge
                  name={tag.name}
                  description={tag.description}
                  variant="secondary"
                />
              </ComboboxItem>
            )}
          </ComboboxCollection>
          <ComboboxEmpty>
            {value.trim().length === 0 ? (
              t('tag-search-hint')
            ) : isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                {t('tag-searching')}
              </span>
            ) : (
              t('tag-no-results')
            )}
          </ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function FilterSelect<T extends string>({
  value,
  allLabel,
  items,
  getLabel,
  onChange,
}: {
  value: T | 'ALL';
  allLabel: string;
  items: T[];
  getLabel: (item: T) => string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">{allLabel}</SelectItem>
        {items.map((item) => (
          <SelectItem key={item} value={item}>
            {getLabel(item)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
