import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateProject } from './hooks';

interface EditDescriptionDialogProps {
  projectId: string;
  version: number;
  description: string | null;
  onClose: () => void;
}

export function EditDescriptionDialog({
  projectId,
  version,
  description,
  onClose,
}: EditDescriptionDialogProps) {
  const updateProject = useUpdateProject(projectId);
  const [value, setValue] = useState(description ?? '');

  const onSave = () => {
    updateProject.mutate({ version, description: value }, { onSuccess: onClose });
  };

  const error = updateProject.error instanceof ApiError ? updateProject.error.message : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit description</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={6}
            autoFocus
            placeholder="What is this project about?"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
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
