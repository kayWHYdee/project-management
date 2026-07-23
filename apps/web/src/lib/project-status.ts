import type { ProjectStatus } from '@water-pm/shared';
import type { BadgeProps } from '@/components/ui/badge';

interface StatusMeta {
  label: string;
  variant: NonNullable<BadgeProps['variant']>;
}

export const PROJECT_STATUSES: ProjectStatus[] = [
  'ENQUIRY',
  'QUOTED',
  'IN_PROGRESS',
  'HANDED_OVER',
  'DLP',
  'CLOSED',
];

const STATUS_META: Record<ProjectStatus, StatusMeta> = {
  ENQUIRY: { label: 'Enquiry', variant: 'muted' },
  QUOTED: { label: 'Quoted', variant: 'default' },
  IN_PROGRESS: { label: 'In progress', variant: 'default' },
  HANDED_OVER: { label: 'Handed over', variant: 'success' },
  DLP: { label: 'DLP', variant: 'default' },
  CLOSED: { label: 'Closed', variant: 'muted' },
};

export function projectStatusLabel(status: ProjectStatus): string {
  return STATUS_META[status].label;
}

export function projectStatusVariant(status: ProjectStatus): NonNullable<BadgeProps['variant']> {
  return STATUS_META[status].variant;
}
