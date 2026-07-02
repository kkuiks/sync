import { zodResolver } from '@hookform/resolvers/zod';
import { useDebounce } from '@uidotdev/usehooks';
import { useTranslations } from 'next-intl';
import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { Controller, useForm } from 'react-hook-form';
import z from 'zod';

import {
  getGetAuthenticatedUserQueryKey,
  useUpdateProfile,
} from '@/api/__generated__/profile/profile';
import { useGetHandleAvailability } from '@/api/__generated__/user/user';
import { FieldError } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

import { OnboardingStepContentProps, OnboardingStepContentRef } from '../page';

const MAXIMUM_HANDLE_LENGTH = 255;
const MINIMUM_HANDLE_LENGTH = 6;

export const ChooseHandle = forwardRef<
  OnboardingStepContentRef,
  OnboardingStepContentProps
>(({ onStateChange }, ref) => {
  const t = useTranslations('pages.onboarding.steps.choose-handle');

  const ChooseHandleFormSchema = z.object({
    handle: z
      .string()
      .regex(/^[a-zA-Z0-9_]+$/, {
        error: t('form.errors.invalid_characters'),
      })
      .min(MINIMUM_HANDLE_LENGTH, {
        error: t('form.errors.minimum_length', {
          length: MINIMUM_HANDLE_LENGTH,
        }),
      })
      .max(MAXIMUM_HANDLE_LENGTH, {
        error: t('form.errors.maximum_length', {
          length: MAXIMUM_HANDLE_LENGTH,
        }),
      }),
  });

  type ChooseHandleFormValues = z.infer<typeof ChooseHandleFormSchema>;
  const form = useForm<ChooseHandleFormValues>({
    resolver: zodResolver(ChooseHandleFormSchema),
    mode: 'onChange',
    defaultValues: {
      handle: '',
    },
  });

  const handle = form.watch('handle');

  const debouncedHandle = useDebounce(handle, 500);

  const {
    data: handleAvailabilityData,
    isPending: isGetHandleAvailabilityPending,
  } = useGetHandleAvailability(
    {
      handle: debouncedHandle,
    },
    {
      query: {
        enabled:
          debouncedHandle.length >= MINIMUM_HANDLE_LENGTH &&
          debouncedHandle.length <= MAXIMUM_HANDLE_LENGTH,
      },
    },
  );

  const { mutate: updateProfile } = useUpdateProfile({
    mutation: {
      onSuccess: (_data, _variables, _onMutateResult, context) => {
        context.client.invalidateQueries({
          queryKey: getGetAuthenticatedUserQueryKey(),
        });
      },
    },
  });

  useEffect(() => {
    if (handleAvailabilityData) {
      const { available } = handleAvailabilityData.data;

      if (!available) {
        form.setError('handle', {
          message: t('form.errors.handle_in_use'),
        });
      } else {
        form.clearErrors('handle');
      }
    }

    const isValid =
      form.formState.isValid && handleAvailabilityData?.data.available === true;

    onStateChange({
      isPending: isGetHandleAvailabilityPending || handle !== debouncedHandle,
      isValid,
    });
  }, [
    t,
    isGetHandleAvailabilityPending,
    handleAvailabilityData,
    form,
    handle,
    debouncedHandle,
    onStateChange,
  ]);

  useImperativeHandle(ref, () => ({
    submit: (onSuccess) => {
      updateProfile(
        {
          data: {
            handle,
          },
        },
        {
          onSuccess: () => {
            onSuccess();
          },
        },
      );
    },
  }));

  return (
    <Controller
      name="handle"
      control={form.control}
      render={({ field, fieldState }) => {
        return (
          <div>
            <InputGroup>
              <InputGroupAddon>@</InputGroupAddon>
              <InputGroupInput
                aria-invalid={fieldState.invalid}
                type="text"
                placeholder={t('form.handle.placeholder')}
                {...field}
              />
            </InputGroup>

            <div className="h-3 p-1">
              <FieldError errors={[fieldState.error]} />
            </div>
          </div>
        );
      }}
    />
  );
});
ChooseHandle.displayName = 'ChooseHandle';
