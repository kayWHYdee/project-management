import { zodResolver } from '@hookform/resolvers/zod';
import { createEmployeeRequestSchema, type CreateEmployeeRequest } from '@water-pm/shared';
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
import { useCreateEmployee } from './hooks';

export function AddEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const createEmployee = useCreateEmployee();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateEmployeeRequest>({
    resolver: zodResolver(createEmployeeRequestSchema),
    defaultValues: { role: 'Technician' },
  });

  const onSubmit = handleSubmit((values) => {
    createEmployee.mutate(values, {
      onSuccess: () => {
        reset({ role: 'Technician' });
        setOpen(false);
      },
    });
  });

  const error = createEmployee.error instanceof ApiError ? createEmployee.error.message : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add employee</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Name" htmlFor="name" error={errors.name?.message}>
            <Input id="name" autoFocus {...register('name')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mobile (optional)" htmlFor="mobile" error={errors.mobile?.message}>
              <Input id="mobile" inputMode="tel" {...register('mobile')} />
            </Field>
            <Field label="Role" htmlFor="role" error={errors.role?.message}>
              <Input id="role" {...register('role')} />
            </Field>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEmployee.isPending}>
              {createEmployee.isPending ? 'Saving…' : 'Add employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
