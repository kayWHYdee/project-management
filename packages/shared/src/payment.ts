import { z } from 'zod';
import { moneySchema } from './money';
import { isoDateSchema } from './date';

/** A payment received from the client on a project. */
export const paymentSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  amount: z.string(),
  receivedOn: z.string(),
  note: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type Payment = z.infer<typeof paymentSchema>;

export const paymentListSchema = z.array(paymentSchema);

export const createPaymentRequestSchema = z.object({
  amount: moneySchema,
  receivedOn: isoDateSchema,
  note: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});
export type CreatePaymentRequest = z.infer<typeof createPaymentRequestSchema>;
