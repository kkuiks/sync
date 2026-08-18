'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import z from 'zod';

import { useGetAuthenticatedUser } from '@/api/__generated__/profile/profile';
import { GetProfileResponse } from '@/api/__generated__/types';
import { ProfileAvatar } from '@/components/feature/profile/ProfileAvatar';
import {
  PROFILE_IMAGE_ALLOWED_TYPES,
  PROFILE_IMAGE_MAX_SIZE_BYTES,
} from '@/components/feature/profile/constants';
import { ContactFields } from '@/components/feature/profile/contacts';
import { useProfileImageUpload } from '@/components/feature/profile/hooks/useProfileImageUpload';
import { useUpdateProfile } from '@/components/feature/profile/hooks/useUpdateProfile';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { FileInput, Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/lib/auth/client';

import { SettingsCategoryRef } from '..';

const ProfileSettingsFormSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    name: z.string().min(1, {
      error: t('form.errors.required_name'),
    }),
    profession: z.string(),
    bio: z.string(),
    contacts: z.object({
      custom: z.string(),
      linkedin: z.string(),
      github: z.string(),
      instagram: z.string(),
      twitter: z.string(),
    }),
  });

type ProfileSettingsFormValues = z.infer<
  ReturnType<typeof ProfileSettingsFormSchema>
>;

const emptyFormValues: ProfileSettingsFormValues = {
  name: '',
  profession: '',
  bio: '',
  contacts: {
    custom: '',
    linkedin: '',
    github: '',
    instagram: '',
    twitter: '',
  },
};

function toFormValues(
  profile: GetProfileResponse | undefined,
): ProfileSettingsFormValues {
  if (!profile) {
    return emptyFormValues;
  }

  const { name, profession, bio, contacts } = profile;

  return {
    name,
    profession,
    bio,
    contacts: {
      custom: contacts?.custom || '',
      linkedin: contacts?.linkedin || '',
      github: contacts?.github || '',
      instagram: contacts?.instagram || '',
      twitter: contacts?.twitter || '',
    },
  };
}

const ProfileSettings = forwardRef<SettingsCategoryRef>(({}, ref) => {
  const t = useTranslations('modals.settings.categories.account.profile');

  const { refetch: refetchSession } = useSession();
  const { data: profile } = useGetAuthenticatedUser();

  const schema = useMemo(() => ProfileSettingsFormSchema(t), [t]);

  const form = useForm<ProfileSettingsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyFormValues,
  });

  const { mutate: updateProfile } = useUpdateProfile({
    handle: profile?.data.handle || '',
    onSuccess: async () => {
      await refetchSession();
      toast.success(t('messages.success'));
    },
  });

  useEffect(() => {
    if (!profile) {
      return;
    }

    form.reset(toFormValues(profile.data));
  }, [form, profile]);

  useImperativeHandle(ref, () => ({
    submit: () => {
      void form.handleSubmit((values) => {
        updateProfile({ data: values });
      })();
    },
    reset: () => {
      form.reset(toFormValues(profile?.data));
    },
  }));

  return (
    <div>
      <h2 className="font-bold">{t('title')}</h2>
      <p className="text-xs mb-4">{t('description')}</p>

      <h3 className="text-sm font-medium">{t('form.groups.basic')}</h3>
      <FieldGroup className="p-3">
        <ProfileImageField />

        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel>{t('form.fields.name.label')}</FieldLabel>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </div>

              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                placeholder={t('form.fields.name.placeholder')}
                autoComplete="name"
              />
            </Field>
          )}
        />

        <Controller
          name="profession"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel>{t('form.fields.profession.label')}</FieldLabel>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </div>

              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                placeholder={t('form.fields.profession.placeholder')}
              />
            </Field>
          )}
        />

        <Controller
          name="bio"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center justify-between">
                <FieldLabel>{t('form.fields.bio.label')}</FieldLabel>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </div>

              <Textarea
                {...field}
                aria-invalid={fieldState.invalid}
                placeholder={t('form.fields.bio.placeholder')}
              />
            </Field>
          )}
        />
      </FieldGroup>

      <h3 className="text-sm font-medium">{t('form.groups.contacts')}</h3>
      <FieldGroup className="p-3">
        {ContactFields.map((contactField) => (
          <Controller
            key={contactField.id}
            name={`contacts.${contactField.id}`}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <InputGroup>
                  <InputGroupAddon>{contactField.icon}</InputGroupAddon>
                  {contactField.prefix && (
                    <InputGroupAddon className="text-muted-foreground">
                      {contactField.prefix}
                    </InputGroupAddon>
                  )}
                  <InputGroupInput {...field} />
                </InputGroup>
              </Field>
            )}
          />
        ))}
      </FieldGroup>
    </div>
  );
});

function ProfileImageField() {
  const t = useTranslations(
    'modals.settings.categories.account.profile.form.image',
  );
  const tCommon = useTranslations();

  const { data: profile } = useGetAuthenticatedUser();

  const {
    selectedImage,
    error,
    isUploadMediaPending,
    handleFileChange,
    handleFileError,
    handleRemoveImage,
  } = useProfileImageUpload({
    handle: profile?.data.handle || '',
    onUploadSuccess: () => toast.success(t('messages.success')),
  });

  if (!profile) {
    return null;
  }

  const errorMessage = error
    ? error.code === 'maxSize'
      ? t('errors.maxSize')
      : error.code === 'unsupportedType'
        ? t('errors.unsupportedType')
        : error.code === 'network'
          ? tCommon('errors.connection-failed')
          : error.code === 'custom'
            ? error.message
            : t('errors.uploadFailed')
    : null;

  return (
    <Field>
      <FieldLabel>{t('label')}</FieldLabel>

      <div className="flex gap-4">
        <ProfileAvatar
          name={profile.data.name}
          seed={profile.data.handle ?? null}
          imageUrl={
            selectedImage ? selectedImage.src : profile.data.profileImageUrl
          }
          className="h-20 w-20"
        />

        <div className="flex flex-col gap-2">
          <div className="flex">
            <FileInput
              onFileChange={handleFileChange}
              onError={handleFileError}
              accept={PROFILE_IMAGE_ALLOWED_TYPES}
              maxSize={PROFILE_IMAGE_MAX_SIZE_BYTES}
              disabled={isUploadMediaPending}
            >
              <Button type="button">
                {profile.data.profileImageUrl || selectedImage
                  ? t('actions.change')
                  : t('actions.upload')}
              </Button>
            </FileInput>

            {(profile.data.profileImageUrl || selectedImage) && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleRemoveImage()}
              >
                {t('actions.remove')}
              </Button>
            )}
          </div>

          <div>
            <div>{t('help.upload')}</div>
            <div>{t('help.public')}</div>
          </div>
        </div>
      </div>

      {errorMessage && <div className="text-destructive">{errorMessage}</div>}
    </Field>
  );
}

ProfileSettings.displayName = 'ProfileSettings';

export default ProfileSettings;
