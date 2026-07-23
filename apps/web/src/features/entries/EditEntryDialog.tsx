import { computeAmount, formatInr, updateEntryRequestSchema, type Entry } from '@water-pm/shared';
import { useMemo, useState } from 'react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateEntry } from './hooks';

interface EditEntryDialogProps {
  projectId: string;
  entry: Entry;
  onClose: () => void;
}

/**
 * Edits an entry's quantity / date / pricing / notes. The item identity is not
 * editable by design — to change what was sent, delete and re-add.
 */
export function EditEntryDialog({ projectId, entry, onClose }: EditEntryDialogProps) {
  const updateEntry = useUpdateEntry(projectId);
  const [quantity, setQuantity] = useState(entry.quantity);
  const [unit, setUnit] = useState(entry.unit ?? 'nos');
  const [sentOn, setSentOn] = useState(entry.sentOn);
  const [rate, setRate] = useState(entry.rate ?? '');
  const [amount, setAmount] = useState(entry.amount ?? '');
  const [description, setDescription] = useState(entry.description ?? '');
  const [receivedBy, setReceivedBy] = useState(entry.receivedBy ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasRate = rate.trim() !== '';
  const amountPreview = useMemo(() => {
    if (!hasRate || !quantity.trim()) return null;
    try {
      return formatInr(computeAmount(quantity, rate));
    } catch {
      return null;
    }
  }, [hasRate, quantity, rate]);

  const onSave = () => {
    const payload: Record<string, unknown> = {
      version: entry.version,
      quantity,
      unit,
      sentOn,
      description,
      receivedBy,
    };
    if (hasRate) {
      payload.rate = rate;
    } else {
      // Clearing the rate switches amount to a manual figure.
      payload.rate = null;
      payload.amount = amount.trim() === '' ? null : amount;
    }

    const parsed = updateEntryRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0] ?? '_')] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    updateEntry.mutate({ id: entry.id, body: parsed.data }, { onSuccess: onClose });
  };

  const generalError = updateEntry.error instanceof ApiError ? updateEntry.error.message : null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit entry — {entry.displayName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity" htmlFor="edit-qty" error={errors.quantity}>
              <Input
                id="edit-qty"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                autoFocus
              />
            </Field>
            <Field label="Unit" htmlFor="edit-unit" error={errors.unit}>
              <Input id="edit-unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </Field>
          </div>

          <Field label="Date" htmlFor="edit-date" error={errors.sentOn}>
            <Input
              id="edit-date"
              type="date"
              value={sentOn}
              onChange={(e) => setSentOn(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Rate (₹, optional)" htmlFor="edit-rate" error={errors.rate}>
              <Input
                id="edit-rate"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </Field>
            {!hasRate && (
              <Field label="Amount (₹, optional)" htmlFor="edit-amount" error={errors.amount}>
                <Input
                  id="edit-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
            )}
          </div>

          {amountPreview && (
            <p className="text-xs text-muted-foreground">
              Amount will be <span className="font-medium text-foreground">{amountPreview}</span>{' '}
              (quantity × rate).
            </p>
          )}

          <Field label="Received by (optional)" htmlFor="edit-received" error={errors.receivedBy}>
            <Input
              id="edit-received"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
            />
          </Field>

          <Field label="Description (optional)" htmlFor="edit-desc" error={errors.description}>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          {generalError && <p className="text-sm text-destructive">{generalError}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={onSave} disabled={updateEntry.isPending}>
              {updateEntry.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
