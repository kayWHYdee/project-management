import {
  createVisitRequestSchema,
  PHOTO_RECEIVED_OPTIONS,
  photoReceivedLabel,
  todayIsoDate,
  type PhotoReceived,
  type System,
} from '@water-pm/shared';
import { useState } from 'react';
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
import { EmployeePicker } from '@/features/employees/EmployeePicker';
import { useCreateVisit } from './hooks';

const emptyForm = () => ({
  employeeId: '',
  visitDate: todayIsoDate() as string,
  hours: '',
  purpose: '',
  systemId: '',
  photoReceived: 'NO' as PhotoReceived,
});

export function AddVisitDialog({ projectId, systems }: { projectId: string; systems: System[] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const createVisit = useCreateVisit(projectId);

  const set = <K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = () => {
    const parsed = createVisitRequestSchema.safeParse({
      employeeId: form.employeeId,
      visitDate: form.visitDate,
      hours: form.hours.trim() === '' ? undefined : form.hours.trim(),
      purpose: form.purpose,
      systemId: form.systemId === '' ? undefined : form.systemId,
      photoReceived: form.photoReceived,
    });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Please check the values');
      return;
    }
    setFieldError(null);
    createVisit.mutate(parsed.data, {
      onSuccess: () => {
        setForm(emptyForm());
        setOpen(false);
      },
    });
  };

  const error =
    fieldError ?? (createVisit.error instanceof ApiError ? createVisit.error.message : null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add visit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add site visit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Employee" htmlFor="visit-employee">
            <EmployeePicker
              value={form.employeeId}
              onChange={(id) => set('employeeId', id)}
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Date" htmlFor="visit-date">
              <Input
                id="visit-date"
                type="date"
                value={form.visitDate}
                onChange={(e) => set('visitDate', e.target.value)}
              />
            </Field>
            <Field label="Hours (optional)" htmlFor="visit-hours">
              <Input
                id="visit-hours"
                inputMode="decimal"
                placeholder="e.g. 2.5"
                value={form.hours}
                onChange={(e) => set('hours', e.target.value)}
              />
            </Field>
          </div>
          <Field label="System (optional)" htmlFor="visit-system">
            <Select
              id="visit-system"
              value={form.systemId}
              onChange={(e) => set('systemId', e.target.value)}
            >
              <option value="">— None —</option>
              {systems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Purpose (optional)" htmlFor="visit-purpose">
            <Textarea
              id="visit-purpose"
              value={form.purpose}
              onChange={(e) => set('purpose', e.target.value)}
            />
          </Field>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Photo received</p>
            <div className="flex flex-wrap gap-2">
              {PHOTO_RECEIVED_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={form.photoReceived === option ? 'default' : 'outline'}
                  onClick={() => set('photoReceived', option)}
                >
                  {photoReceivedLabel(option)}
                </Button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={createVisit.isPending || !form.employeeId}
            >
              {createVisit.isPending ? 'Saving…' : 'Add visit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
