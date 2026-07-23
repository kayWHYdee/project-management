import {
  allowsCustomName,
  computeAmount,
  createEntryRequestSchema,
  formatInr,
  todayIsoDate,
  type Item,
  type System,
} from '@water-pm/shared';
import { useMemo, useState } from 'react';
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
import { ItemPicker } from '@/components/items/ItemPicker';
import { useCreateEntry } from './hooks';

interface AddEntryDialogProps {
  projectId: string;
  systems: System[];
  canAdd: boolean;
}

interface DraftState {
  systemId: string;
  sentOn: string;
  unit: string;
}

const initialDraft = (systems: System[]): DraftState => ({
  systemId: systems[0]?.id ?? '',
  sentOn: todayIsoDate(),
  unit: 'nos',
});

export function AddEntryDialog({ projectId, systems, canAdd }: AddEntryDialogProps) {
  const createEntry = useCreateEntry(projectId);
  const [open, setOpen] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);

  // Fields kept across "save and add another": system, date, unit.
  const [draft, setDraft] = useState<DraftState>(() => initialDraft(systems));
  // Fields cleared each time.
  const [item, setItem] = useState<Item | null>(null);
  const [customName, setCustomName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [rate, setRate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedSystem = systems.find((s) => s.id === draft.systemId);
  const customAllowed = selectedSystem ? allowsCustomName(selectedSystem.type) : false;
  const [useCustom, setUseCustom] = useState(false);
  const customMode = customAllowed && useCustom;

  const amountPreview = useMemo(() => {
    if (!rate.trim() || !quantity.trim()) return null;
    try {
      return formatInr(computeAmount(quantity, rate));
    } catch {
      return null;
    }
  }, [rate, quantity]);

  const clearVariableFields = () => {
    setItem(null);
    setCustomName('');
    setQuantity('');
    setDescription('');
    setReceivedBy('');
    setRate('');
    setErrors({});
    setPickerKey((k) => k + 1);
  };

  const resetAll = () => {
    setDraft(initialDraft(systems));
    setUseCustom(false);
    clearVariableFields();
  };

  const submit = (addAnother: boolean) => {
    const payload = {
      systemId: draft.systemId,
      ...(customMode ? { customName } : { itemId: item?.id }),
      quantity,
      unit: draft.unit || undefined,
      sentOn: draft.sentOn,
      description: description || undefined,
      receivedBy: receivedBy || undefined,
      rate: rate || undefined,
    };
    const parsed = createEntryRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '_');
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }

    createEntry.mutate(parsed.data, {
      onSuccess: () => {
        if (addAnother) {
          clearVariableFields();
        } else {
          resetAll();
          setOpen(false);
        }
      },
    });
  };

  const generalError = createEntry.error instanceof ApiError ? createEntry.error.message : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetAll();
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={!canAdd || systems.length === 0}>Add entry</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add entry</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(false);
          }}
          className="space-y-4"
          noValidate
        >
          <Field label="System" htmlFor="systemId" error={errors.systemId}>
            <Select
              id="systemId"
              value={draft.systemId}
              onChange={(event) => {
                setDraft((d) => ({ ...d, systemId: event.target.value }));
                setUseCustom(false);
              }}
            >
              {systems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={customMode ? 'Custom item name' : 'Item'}
            htmlFor="item"
            error={errors.itemId ?? errors.customName}
          >
            {customMode ? (
              <Input
                id="item"
                autoFocus
                value={customName}
                onChange={(event) => setCustomName(event.target.value)}
                placeholder="One-off spare name"
              />
            ) : (
              <ItemPicker
                key={pickerKey}
                onSelect={setItem}
                canAdd={canAdd}
                autoFocus
                placeholder="Type to search…"
              />
            )}
            {customAllowed && (
              <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={useCustom}
                  onChange={(event) => setUseCustom(event.target.checked)}
                />
                Enter a one-off custom name instead of a catalog item
              </label>
            )}
            {!customMode && item && (
              <p className="mt-1 text-xs text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{item.name}</span>
              </p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity" htmlFor="quantity" error={errors.quantity}>
              <Input
                id="quantity"
                inputMode="decimal"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </Field>
            <Field label="Unit" htmlFor="unit" error={errors.unit}>
              <Input
                id="unit"
                value={draft.unit}
                onChange={(event) => setDraft((d) => ({ ...d, unit: event.target.value }))}
              />
            </Field>
          </div>

          <Field label="Date" htmlFor="sentOn" error={errors.sentOn}>
            <Input
              id="sentOn"
              type="date"
              value={draft.sentOn}
              onChange={(event) => setDraft((d) => ({ ...d, sentOn: event.target.value }))}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Rate (₹, optional)" htmlFor="rate" error={errors.rate}>
              <Input
                id="rate"
                inputMode="decimal"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
              />
            </Field>
            <Field label="Received by (optional)" htmlFor="receivedBy" error={errors.receivedBy}>
              <Input
                id="receivedBy"
                value={receivedBy}
                onChange={(event) => setReceivedBy(event.target.value)}
              />
            </Field>
          </div>

          {amountPreview && (
            <p className="text-xs text-muted-foreground">
              Amount will be <span className="font-medium text-foreground">{amountPreview}</span>{' '}
              (quantity × rate).
            </p>
          )}

          <Field label="Description (optional)" htmlFor="description" error={errors.description}>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>

          {generalError && <p className="text-sm text-destructive">{generalError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={createEntry.isPending}
              onClick={() => submit(true)}
            >
              Save &amp; add another
            </Button>
            <Button type="submit" disabled={createEntry.isPending}>
              {createEntry.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
