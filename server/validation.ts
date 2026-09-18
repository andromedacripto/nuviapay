/**
 * Nuvia — Input validation & sanitization (Zod schemas)
 *
 * All API inputs are validated here before reaching service layer.
 * Zod v4 API is used throughout.
 */
import { z } from 'zod';

// ─── Primitives ───────────────────────────────────────────────────────────────

/** EVM wallet address — 0x + 40 hex chars, lowercase-normalised */
export const WalletAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid EVM wallet address');

/** Positive decimal string — max 18 integer digits, 6 decimal places */
export const AmountSchema = z
  .string()
  .trim()
  .regex(/^\d{1,18}(\.\d{1,6})?$/, 'Invalid amount format')
  .refine((v) => parseFloat(v) > 0, 'Amount must be greater than 0')
  .refine((v) => parseFloat(v) <= 10_000_000, 'Amount exceeds maximum');

/** Safe text: strips leading/trailing whitespace, no control chars, max length */
function safeText(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .regex(/^[^\x00-\x1F\x7F]*$/, 'Invalid characters');
}

/** ISO 3166-1 alpha-2 country code */
export const CountrySchema = z
  .string()
  .trim()
  .length(2)
  .regex(/^[A-Z]{2}$/, 'Invalid country code (use ISO alpha-2 e.g. US, GB)');

/** Currency enum */
export const CurrencySchema = z.enum(['USDC', 'USD', 'EUR', 'BRL', 'GBP']).default('USDC');

/** Payment status enum — only statuses clients may request */
export const PaymentStatusTransitionSchema = z.enum([
  'quoted', 'pending_approval', 'processing', 'submitted', 'confirmed', 'failed', 'cancelled',
]);

/** Idempotency key — URL-safe chars, 8–128 length */
export const IdempotencyKeySchema = z
  .string()
  .trim()
  .min(8, 'Idempotency key must be at least 8 characters')
  .max(128, 'Idempotency key must be 128 characters or fewer')
  .regex(/^[a-zA-Z0-9_\-]+$/, 'Idempotency key may only contain letters, digits, _ and -')
  .optional();

// ─── Resource schemas ─────────────────────────────────────────────────────────

export const CreatePaymentSchema = z.object({
  amount:           AmountSchema,
  currency:         CurrencySchema,
  beneficiary_name: safeText(200),
  wallet_address:   WalletAddressSchema,
  country:          CountrySchema.optional().default('US'),
  reference:        safeText(256).optional(),
  idempotency_key:  IdempotencyKeySchema,
});

export const CreateBeneficiarySchema = z.object({
  name:           safeText(200),
  wallet_address: WalletAddressSchema,
  company:        safeText(200).optional(),
  country:        CountrySchema.optional().default('US'),
  label:          safeText(100).optional(),
});

export const UpdateBeneficiarySchema = z.object({
  name:           safeText(200).optional(),
  company:        safeText(200).optional(),
  wallet_address: WalletAddressSchema.optional(),
  country:        CountrySchema.optional(),
  label:          safeText(100).optional(),
}).refine((v) => Object.keys(v).length > 0, 'At least one field required');

export const RecordTransactionSchema = z.object({
  tx_hash:      z.string().trim().regex(/^0x[0-9a-fA-F]{64}$/, 'Invalid tx hash (must be 0x + 64 hex chars)'),
  from_address: WalletAddressSchema,
  to_address:   WalletAddressSchema,
  amount:       AmountSchema,
});

export const PaymentStatusPatchSchema = z.object({
  status: PaymentStatusTransitionSchema,
});

export const SyncBalanceSchema = z.object({
  usdc_balance: AmountSchema,
});

export const SyncAddressSchema = z.object({
  address: WalletAddressSchema,
});

export const WebhookVerifySchema = z.object({
  event_id: z.string().trim().min(1).max(64),
  signature: z.string().trim().min(1).max(256),
});

// ─── Pagination ───────────────────────────────────────────────────────────────
export const PaginationSchema = z.object({
  limit:  z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  status: z.string().optional(),
});

// ─── Query param IDs ─────────────────────────────────────────────────────────
export const EntityIdSchema = z
  .string()
  .trim()
  .min(4)
  .max(64)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format');

// ─── Validation helper ────────────────────────────────────────────────────────
import type { Request, Response } from 'express';

export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown,
  res: Response,
): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    res.status(422).json({ error: 'Validation failed', details: errors });
    return null;
  }
  return result.data;
}

export function validateQuery<T>(
  schema: z.ZodType<T>,
  req: Request,
  res: Response,
): T | null {
  return validate(schema, req.query, res);
}

export function validateParams(
  req: Request,
  res: Response,
  paramName = 'id',
): string | null {
  const raw = req.params[paramName];
  const result = EntityIdSchema.safeParse(raw);
  if (!result.success) {
    res.status(400).json({ error: `Invalid ${paramName} format` });
    return null;
  }
  return result.data;
}
