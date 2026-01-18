// Canonical WhatsApp Business Cloud API config derived from validated env.
import { env } from './env';

export const whatsappConfig = {
  baseUrl: 'https://graph.facebook.com/v19.0',
  phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
  verifyToken: env.WHATSAPP_VERIFY_TOKEN,
  accessToken: env.WHATSAPP_TOKEN,
};

export type WhatsappConfig = typeof whatsappConfig;

