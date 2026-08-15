import {
  PHOTO_RECEIVED_OPTIONS,
  photoReceivedLabel,
  updateVisitRequestSchema,
  type PhotoReceived,
  type System,
  type Visit,
} from '@water-pm/shared';
import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateVisit } from './hooks';

/**
 * Edit one visit. `systems` is only known on the project page, so the system
 * selector shows there; on the man-power page it is omitted and the system is
 * left unchanged.
 */
export function EditVisitDialog({
  visit,
  systems,
  onClose,
}: {
  visit: Visit;
  systems?: System[];
  onClose: () => void;
}) {
  const updateVisit = useUpdateVisit(visit.projectId);
  const [visitDate, setVisitDate] = useState(visit.visitDate);
  const [hours, setHours] = useState(visit.hours ?? '');
  const [purpose, setPurpose] = useState(visit.purpose ?? '');
  const [systemId, setSystemId] = useState(visit.systemId ?? '');
  const [photoReceived, setPhotoReceived] = useState<PhotoReceived>(visit.photoReceived);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const onSave = () => {
    const parsed = updateVisitRequestSchema.safeParse({
      version: visit.version,
      visitDate,
      hours: hours.trim() === '' ? null : hours.trim(),
      purpose,
      ...(systems ? { systemId: systemId === '' ? null : systemId } : {}),
      photoReceived,
    });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Please check the values');
      return;
    }
    setFieldError(null);
    updateVisit.mutate({ id: visit.id, body: parsed.data }, { onSuccess: onClose });
  };

  const error =
    fieldError ?? (updateVisit.error instanceof ApiError ? updateVisit.error.message : null);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit visit — {visit.employeeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Date" htmlFor="edit-visit-date">
              <Input
                id="edit-visit-date"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </Field>
            <Field label="Hours (optional)" htmlFor="edit-visit-hours">
              <Input
                id="edit-visit-hours"
                inputMode="decimal"
                placeholder="e.g. 2.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </Field>
          </div>
          {systems && (
            <Field label="System (optional)" htmlFor="edit-visit-system">
              <Select
                id="edit-visit-system"
                value={systemId}
                onChange={(e) => setSystemId(e.target.value)}
              >
                <option value="">— None —</option>
                {systems.map((system) => (
                  <option key={system.id} value={system.id}>
                    {system.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Purpose (optional)" htmlFor="edit-visit-purpose">
            <Textarea
              id="edit-visit-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
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
                  variant={photoReceived === option ? 'default' : 'outline'}
                  onClick={() => setPhotoReceived(option)}
                >
                  {photoReceivedLabel(option)}
                </Button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={onSave} disabled={updateVisit.isPending}>
              {updateVisit.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
