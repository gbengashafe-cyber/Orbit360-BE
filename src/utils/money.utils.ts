import { z } from 'zod';

export const MONEY = {
  SCALE: 2,
  MAX_VALUE: 9_999_999_999_999.99,
};

export const moneySchema = z.preprocess(
  (val) => (typeof val === 'string' ? Number(val) : val),
  z
    .number({
      error: (val) => (!val ? 'Amount is required' : 'Please enter a valid number for the amount'),
    })
    .nonnegative('Amount cannot be a negative value')
    .refine((v) => {
      const parts = v.toString().split('.');
      return !parts[1] || parts[1].length <= MONEY.SCALE;
    }, `Please provide at most ${MONEY.SCALE} decimal places (e.g., 100.50)`)
    .refine((v) => v <= MONEY.MAX_VALUE, `Amount is too large (maximum allowed is ${MONEY.MAX_VALUE.toLocaleString()})`),
);
