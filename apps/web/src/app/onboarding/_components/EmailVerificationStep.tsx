'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import {
  useSendVerificationEmail,
  useVerifyEmail,
} from '@/api/__generated__/auth/auth';
import {
  getGetAuthenticatedUserQueryKey,
  useGetAuthenticatedUser,
} from '@/api/__generated__/profile/profile';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import SyncError, { ErrorCode } from '@/lib/error';

import { OnboardingStepContentProps, OnboardingStepContentRef } from '../page';

export const EmailVerificationStep = forwardRef<
  OnboardingStepContentRef,
  OnboardingStepContentProps
>(({ onStateChange }, ref) => {
  const t = useTranslations('pages.onboarding.steps.email-verification');

  const queryClient = useQueryClient();
  const { data: profile, isPending: isProfilePending } =
    useGetAuthenticatedUser();

  const [isVerified, setIsVerified] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.data.isEmailVerified) {
      setIsVerified(true);
    }
  }, [profile]);

  useImperativeHandle(ref, () => ({
    submit: (onSuccess) => onSuccess(),
  }));

  useEffect(() => {
    onStateChange({ isPending: isProfilePending, isValid: isVerified });
  }, [isVerified, isProfilePending, onStateChange]);

  const invalidateProfile = () =>
    queryClient.invalidateQueries({
      queryKey: getGetAuthenticatedUserQueryKey(),
    });

  const treatAsAlreadyVerified = () => {
    setIsVerified(true);
    invalidateProfile();
    toast.info(t('messages.alreadyVerified'));
  };

  const { mutate: sendVerificationEmail } = useSendVerificationEmail({
    mutation: {
      onSuccess: () => {
        setHasSent(true);
        toast.success(t('messages.sent'));
      },
      onError: (sendError) => {
        if (
          sendError instanceof SyncError &&
          sendError.code === ErrorCode.EMAIL_ALREADY_VERIFIED
        ) {
          treatAsAlreadyVerified();
          return;
        }
        toast.error(t('errors.send'));
      },
    },
  });

  const { mutate: verifyEmail, isPending: isVerifyPending } = useVerifyEmail({
    mutation: {
      onSuccess: async () => {
        setIsVerified(true);
        setError(null);
        await invalidateProfile();
        toast.success(t('messages.verified'));
      },
      onError: (verifyError) => {
        if (
          verifyError instanceof SyncError &&
          verifyError.code === ErrorCode.EMAIL_ALREADY_VERIFIED
        ) {
          treatAsAlreadyVerified();
          return;
        }
        setError(t('errors.invalidToken'));
      },
    },
  });

  const hasAutoSentRef = useRef(false);

  useEffect(() => {
    if (isProfilePending || isVerified || hasAutoSentRef.current) {
      return;
    }
    hasAutoSentRef.current = true;
    sendVerificationEmail();
  }, [isProfilePending, isVerified, sendVerificationEmail]);

  const sendClickHandler = () => {
    setError(null);
    sendVerificationEmail();
  };

  const verifyClickHandler = () => {
    setError(null);
    verifyEmail({ data: { token } });
  };

  if (isProfilePending) {
    return null;
  }

  if (isVerified) {
    return (
      <p className="text-muted-foreground text-sm">{t('messages.verified')}</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant={hasSent ? 'outline' : 'default'}
        onClick={sendClickHandler}
      >
        {hasSent ? t('actions.resend') : t('actions.send')}
      </Button>

      {hasSent && (
        <Field>
          <FieldLabel>{t('form.token.label')}</FieldLabel>
          <div className="flex gap-2">
            <Input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder={t('form.token.placeholder')}
            />
            <Button
              type="button"
              isPending={isVerifyPending}
              disabled={token.length === 0}
              onClick={verifyClickHandler}
            >
              {t('actions.verify')}
            </Button>
          </div>
          <div className="h-3 p-1">
            <FieldError errors={error ? [{ message: error }] : []} />
          </div>
        </Field>
      )}
    </div>
  );
});
EmailVerificationStep.displayName = 'EmailVerificationStep';
