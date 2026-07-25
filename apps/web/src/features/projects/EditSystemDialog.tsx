import type { System } from '@water-pm/shared';
import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateSystem } from './hooks';

export function EditSystemDialog({
  projectId,
  system,
  onClose,
}: {
  projectId: string;
  system: System;
  onClose: () => void;
}) {
  const updateSystem = useUpdateSystem(projectId);
  const [label, setLabel] = useState(system.label);
  const [notes, setNotes] = useState(system.notes ?? '');

  const onSave = () => {
    updateSystem.mutate(
      { id: system.id, body: { label: label.trim(), notes } },
      { onSuccess: onClose },
    );
  };

  const error = updateSystem.error instanceof ApiError ? updateSystem.error.message : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit system</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Label" htmlFor="system-label">
            <Input
              id="system-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Notes" htmlFor="system-notes">
            <Textarea id="system-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={updateSystem.isPending || !label.trim()}
            >
              {updateSystem.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
