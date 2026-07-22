import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordRequestSchema, type ChangePasswordRequest } from '@water-pm/shared';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useChangePassword } from '@/features/auth/hooks';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordRequest>({ resolver: zodResolver(changePasswordRequestSchema) });

  const onSubmit = handleSubmit((values) => {
    changePassword.mutate(values, {
      onSuccess: () =>
        navigate('/login', {
          replace: true,
          state: { notice: 'Password changed. Please sign in again.' },
        }),
      onError: (error) => {
        if (error instanceof ApiError && error.fieldErrors) {
          for (const [key, messages] of Object.entries(error.fieldErrors)) {
            if ((key === 'currentPassword' || key === 'newPassword') && messages[0]) {
              setError(key, { message: messages[0] });
            }
          }
        }
      },
    });
  });

  const generalError =
    changePassword.error instanceof ApiError && !changePassword.error.fieldErrors
      ? changePassword.error.message
      : null;

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>You will be signed out on all devices afterwards.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field
              label="Current password"
              htmlFor="currentPassword"
              error={errors.currentPassword?.message}
            >
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                {...register('currentPassword')}
              />
            </Field>
            <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...register('newPassword')}
              />
            </Field>

            {generalError && <p className="text-sm text-destructive">{generalError}</p>}

            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Saving…' : 'Change password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
