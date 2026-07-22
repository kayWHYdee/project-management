import { zodResolver } from '@hookform/resolvers/zod';
import { createUserRequestSchema, type CreateUserRequest } from '@water-pm/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCreateUser } from './hooks';

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const createUser = useCreateUser();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateUserRequest>({
    resolver: zodResolver(createUserRequestSchema),
    defaultValues: { role: 'EDITOR' },
  });

  const onSubmit = handleSubmit((values) => {
    createUser.mutate(values, {
      onSuccess: () => {
        reset({ role: 'EDITOR' });
        setOpen(false);
      },
      onError: (error) => {
        if (error instanceof ApiError && error.fieldErrors) {
          for (const [key, messages] of Object.entries(error.fieldErrors)) {
            if (key in values && messages[0]) {
              setError(key as keyof CreateUserRequest, { message: messages[0] });
            }
          }
        }
      },
    });
  });

  const generalError =
    createUser.error instanceof ApiError && !createUser.error.fieldErrors
      ? createUser.error.message
      : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add user</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Name" htmlFor="name" error={errors.name?.message}>
            <Input id="name" autoFocus {...register('name')} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="off" {...register('email')} />
          </Field>
          <Field label="Initial password" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="text" autoComplete="off" {...register('password')} />
          </Field>
          <Field label="Role" htmlFor="role" error={errors.role?.message}>
            <Select id="role" {...register('role')}>
              <option value="OWNER">Owner</option>
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </Select>
          </Field>

          {generalError && <p className="text-sm text-destructive">{generalError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? 'Creating…' : 'Create user'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
