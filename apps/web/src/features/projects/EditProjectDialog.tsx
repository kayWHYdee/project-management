import { updateProjectRequestSchema, type Project } from '@water-pm/shared';
import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateProject } from './hooks';

/** One place to edit a project's details (status stays on the inline dropdown). */
export function EditProjectDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const updateProject = useUpdateProject(project.id);
  const [name, setName] = useState(project.name);
  const [startDate, setStartDate] = useState(project.startDate ?? '');
  const [budget, setBudget] = useState(project.budgetValue ?? '');
  const [address, setAddress] = useState(project.address ?? '');
  const [description, setDescription] = useState(project.description ?? '');
  const [notes, setNotes] = useState(project.notes ?? '');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const onSave = () => {
    // Empty date/budget clears the field; everything is validated before sending.
    const parsed = updateProjectRequestSchema.safeParse({
      version: project.version,
      name: name.trim(),
      startDate: startDate.trim() === '' ? null : startDate.trim(),
      budgetValue: budget.trim() === '' ? null : budget.trim(),
      address,
      description,
      notes,
    });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Please check the values');
      return;
    }
    setFieldError(null);
    updateProject.mutate(parsed.data, { onSuccess: onClose });
  };

  const error =
    fieldError ?? (updateProject.error instanceof ApiError ? updateProject.error.message : null);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name" htmlFor="proj-name">
            <Input
              id="proj-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date" htmlFor="proj-start">
              <Input
                id="proj-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Field>
            <Field label="Budget (₹)" htmlFor="proj-budget">
              <Input
                id="proj-budget"
                inputMode="decimal"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="blank to clear"
              />
            </Field>
          </div>
          <Field label="Address" htmlFor="proj-address">
            <Input id="proj-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field label="Description" htmlFor="proj-desc">
            <Textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="Notes" htmlFor="proj-notes">
            <Textarea id="proj-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={updateProject.isPending || !name.trim()}
            >
              {updateProject.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
