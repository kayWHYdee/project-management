import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectRequestSchema, type CreateProjectRequest } from '@water-pm/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
import { Textarea } from '@/components/ui/textarea';
import { PROJECT_STATUSES, projectStatusLabel } from '@/lib/project-status';
import { useClients } from '@/features/clients/hooks';
import { useCreateProject } from './hooks';

const emptyToUndefined = (value: string) => (value === '' ? undefined : value);

export function CreateProjectDialog({ defaultClientId }: { defaultClientId?: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const clients = useClients();
  const createProject = useCreateProject();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectRequest>({
    resolver: zodResolver(createProjectRequestSchema),
    defaultValues: { clientId: defaultClientId, status: 'ENQUIRY' },
  });

  const onSubmit = handleSubmit((values) => {
    createProject.mutate(values, {
      onSuccess: (project) => {
        reset();
        setOpen(false);
        navigate(`/projects/${project.id}`);
      },
    });
  });

  const error = createProject.error instanceof ApiError ? createProject.error.message : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add project</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Client" htmlFor="clientId" error={errors.clientId?.message}>
            <Select id="clientId" {...register('clientId')} defaultValue={defaultClientId ?? ''}>
              <option value="" disabled>
                Select a client…
              </option>
              {clients.data?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Project name" htmlFor="name" error={errors.name?.message}>
            <Input id="name" autoFocus {...register('name')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status" htmlFor="status" error={errors.status?.message}>
              <Select id="status" {...register('status')}>
                {PROJECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {projectStatusLabel(status)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Start date" htmlFor="startDate" error={errors.startDate?.message}>
              <Input
                id="startDate"
                type="date"
                {...register('startDate', { setValueAs: emptyToUndefined })}
              />
            </Field>
          </div>
          <Field label="Budget (₹)" htmlFor="budgetValue" error={errors.budgetValue?.message}>
            <Input
              id="budgetValue"
              inputMode="decimal"
              placeholder="e.g. 250000.00"
              {...register('budgetValue', { setValueAs: emptyToUndefined })}
            />
          </Field>
          <Field label="Description" htmlFor="description" error={errors.description?.message}>
            <Textarea id="description" {...register('description')} />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? 'Saving…' : 'Create project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
