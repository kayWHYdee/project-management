import type { Prisma } from '@prisma/client';
import type { Entry } from '@water-pm/shared';
import { utcDateToIsoDate } from '@water-pm/shared';

export type EntryWithRelations = Prisma.EntryGetPayload<{
  include: { system: true; item: true };
}>;

/** Maps a Prisma entry (with system + item joined) to the shared Entry contract. */
export function mapEntry(entry: EntryWithRelations): Entry {
  const displayName = entry.item?.name ?? entry.customName ?? '';
  return {
    id: entry.id,
    systemId: entry.systemId,
    systemLabel: entry.system.label,
    systemType: entry.system.type,
    itemId: entry.itemId,
    itemName: entry.item?.name ?? null,
    customName: entry.customName,
    displayName,
    description: entry.description,
    quantity: entry.quantity.toFixed(3),
    unit: entry.unit,
    sentOn: utcDateToIsoDate(entry.sentOn),
    receivedBy: entry.receivedBy,
    rate: entry.rate ? entry.rate.toFixed(2) : null,
    amount: entry.amount ? entry.amount.toFixed(2) : null,
    notes: entry.notes,
    version: entry.version,
    createdAt: entry.createdAt.toISOString(),
  };
}
