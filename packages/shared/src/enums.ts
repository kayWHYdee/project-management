import { z } from 'zod';

/**
 * Domain enums live here as the single source of truth for both apps. They must
 * stay in lock-step with the Prisma enums of the same names.
 */

export const projectStatusSchema = z.enum([
  'ENQUIRY',
  'QUOTED',
  'IN_PROGRESS',
  'HANDED_OVER',
  'DLP',
  'CLOSED',
]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const systemTypeSchema = z.enum([
  'POOL',
  'FOUNTAIN',
  'RO',
  'STP',
  'WTP',
  'SPARES',
  'CONSUMABLES',
]);
export type SystemType = z.infer<typeof systemTypeSchema>;

/** System types that permit free-text `customName` entries instead of a catalog item. */
export const CUSTOM_NAME_SYSTEM_TYPES: readonly SystemType[] = ['SPARES', 'CONSUMABLES'];

export function allowsCustomName(type: SystemType): boolean {
  return CUSTOM_NAME_SYSTEM_TYPES.includes(type);
}

/** System types auto-created on every project and never deletable. */
export const AUTO_SYSTEM_TYPES: readonly SystemType[] = ['SPARES', 'CONSUMABLES'];

export const itemCategorySchema = z.enum([
  'MECHANICAL',
  'ELECTRICAL',
  'CHEMICAL',
  'MEDIA',
  'FITTINGS',
  'OTHER',
]);
export type ItemCategory = z.infer<typeof itemCategorySchema>;

export const roleSchema = z.enum(['OWNER', 'EDITOR', 'VIEWER']);
export type Role = z.infer<typeof roleSchema>;

/** Whether (and by whom) a site-visit photo was received. */
export const photoReceivedSchema = z.enum(['YES_CHACHU', 'YES_PRANAV', 'NO']);
export type PhotoReceived = z.infer<typeof photoReceivedSchema>;

export const PHOTO_RECEIVED_OPTIONS = photoReceivedSchema.options;

const PHOTO_RECEIVED_LABEL: Record<PhotoReceived, string> = {
  YES_CHACHU: 'Yes (Chachu)',
  YES_PRANAV: 'Yes (Pranav)',
  NO: 'No',
};

export function photoReceivedLabel(value: PhotoReceived): string {
  return PHOTO_RECEIVED_LABEL[value];
}

const HUMANISED_SYSTEM_TYPE: Record<SystemType, string> = {
  POOL: 'Pool',
  FOUNTAIN: 'Fountain',
  RO: 'RO Plant',
  STP: 'STP',
  WTP: 'WTP',
  SPARES: 'Spares',
  CONSUMABLES: 'Consumables',
};

/** Default label for a system when the user leaves the label blank. */
export function humaniseSystemType(type: SystemType): string {
  return HUMANISED_SYSTEM_TYPE[type];
}
