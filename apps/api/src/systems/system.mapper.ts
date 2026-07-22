import type { System as PrismaSystem } from '@prisma/client';
import type { System } from '@water-pm/shared';

/** Maps a Prisma system row to the shared System contract. */
export function mapSystem(system: PrismaSystem): System {
  return {
    id: system.id,
    projectId: system.projectId,
    type: system.type,
    label: system.label,
    notes: system.notes,
    createdAt: system.createdAt.toISOString(),
  };
}
