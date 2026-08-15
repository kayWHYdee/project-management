import type { Prisma } from '@prisma/client';
import type { Visit } from '@water-pm/shared';
import { utcDateToIsoDate } from '@water-pm/shared';

export type VisitWithRelations = Prisma.VisitGetPayload<{
  include: { project: true; employee: true; system: true };
}>;

/** Maps a Prisma visit (with project + employee + optional system) to the shared contract. */
export function mapVisit(visit: VisitWithRelations): Visit {
  return {
    id: visit.id,
    projectId: visit.projectId,
    projectName: visit.project.name,
    employeeId: visit.employeeId,
    employeeName: visit.employee.name,
    systemId: visit.systemId,
    systemLabel: visit.system?.label ?? null,
    purpose: visit.purpose,
    visitDate: utcDateToIsoDate(visit.visitDate),
    hours: visit.hours ? visit.hours.toFixed(2) : null,
    photoReceived: visit.photoReceived,
    version: visit.version,
    createdAt: visit.createdAt.toISOString(),
  };
}
