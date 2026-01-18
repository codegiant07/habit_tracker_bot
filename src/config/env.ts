/// <reference path="../types/global.d.ts" />
// Centralized env loader with validation to fail fast on missing config.
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.string().default('info'),
  // Accept MySQL URLs; zod's .url() rejects non-http schemes, so we refine instead.
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((v) => v.startsWith('mysql://') || v.startsWith('mysql+srv://'), {
      message: 'DATABASE_URL must start with mysql://',
    }),
  WHATSAPP_VERIFY_TOKEN: z.string(),
  WHATSAPP_TOKEN: z.string(),
  WHATSAPP_PHONE_NUMBER_ID: z.string(),
  REMINDER_CRON: z.string().default('0 9 * * *'), // default: 9am daily
  DAILY_SUMMARY_CRON: z.string().default('0 20 * * *'), // default: 8pm daily
  WEEKLY_SUMMARY_CRON: z.string().default('0 20 * * SUN'), // default: Sundays 8pm
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;

