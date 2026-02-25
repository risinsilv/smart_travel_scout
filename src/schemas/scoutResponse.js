import { z } from 'zod';

/**
 * Valid inventory IDs — must be kept in sync with src/data/inventory.json.
 * Using an enum ensures the AI can only reference items that actually exist.
 */
const VALID_IDS = [1, 2, 3, 4, 5];

/**
 * Schema for a single matched travel item returned by the AI.
 * The AI returns only the ID and its reasoning; we enrich with full item
 * details in the serverless function after validation passes.
 */
export const MatchSchema = z.object({
  id: z
    .number()
    .int()
    .refine((val) => VALID_IDS.includes(val), {
      message: `ID must be one of the valid inventory IDs: ${VALID_IDS.join(', ')}`,
    }),
  reason: z.string().min(1, 'Reason must not be empty'),
});

/**
 * Top-level schema for the entire AI response.
 * - matches: 0–5 items (at most the full inventory)
 * - fallback_message: optional message shown when no good match exists
 */
export const ScoutResponseSchema = z.object({
  matches: z
    .array(MatchSchema)
    .max(VALID_IDS.length, `Cannot return more than ${VALID_IDS.length} matches`),
  fallback_message: z.string().optional(),
});

/** Inferred TypeScript-friendly type (useful if you migrate to TS later) */
export const VALID_INVENTORY_IDS = VALID_IDS;
