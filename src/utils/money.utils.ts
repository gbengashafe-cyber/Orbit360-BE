import { z } from 'zod';

// Rounds to DECIMAL(12,2) safely
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export const toCents = (amount: number): number => Math.round((amount + Number.EPSILON) * 100);

export const fromCents = (cents: number): number => cents / 100;

export const MONEY = {
  SCALE: 2,
  MAX_KOBO: 999_999_999_999_999,
};

export const moneySchema = z
  .number({})
  .positive('Amount must be greater than 0')
  .refine((v) => Number.isFinite(v), 'Amount must be a finite number')
  .refine((v) => Number.isInteger(v * 10 ** MONEY.SCALE), `Amount must have at most ${MONEY.SCALE} decimal places`)
  .refine((v) => v <= MONEY.MAX_KOBO, 'Amount exceeds maximum allowed value')
  .describe(`Money amount (DECIMAL(15,2), max ${MONEY.MAX_KOBO})`);
