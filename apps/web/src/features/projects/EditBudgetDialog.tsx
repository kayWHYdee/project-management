import { updateProjectRequestSchema } from '@water-pm/shared';
import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useUpdateProject } from './hooks';

interface EditBudgetDialogProps {
  projectId: string;
  version: number;
  budget: string | null;
  onClose: () => void;
}

export function EditBudgetDialog({ projectId, version, budget, onClose }: EditBudgetDialogProps) {
  const updateProject = useUpdateProject(projectId);
  const [value, setValue] = useState(budget ?? '');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const onSave = () => {
    // Empty clears the budget; otherwise validate the amount before sending.
    const parsed = updateProjectRequestSchema.safeParse({
      version,
      budgetValue: value.trim() === '' ? null : value.trim(),
    });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Enter a valid amount');
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
          <DialogTitle>Edit budget</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Budget (₹)" htmlFor="budget" error={error ?? undefined}>
            <Input
              id="budget"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              placeholder="e.g. 250000.00 — leave blank to clear"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={onSave} disabled={updateProject.isPending}>
              {updateProject.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
