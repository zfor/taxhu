import { z } from 'zod';

const supportedCurrencySchema = z.enum(['HUF', 'EUR', 'USD', 'GBP']);

const transactionSchema = z.object({
  date: z.date(),
  currency: supportedCurrencySchema,
  profit: z.string().refine((value) => /^\-?\d+\.?\d*$/.test(value)),
  type: z.enum(['interest', 'capital-gains']),
});

export type Transaction = z.infer<typeof transactionSchema>;

export type SupportedCurrency = z.infer<typeof supportedCurrencySchema>;
