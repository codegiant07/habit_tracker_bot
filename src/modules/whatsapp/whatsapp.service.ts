// Adapter to call WhatsApp Business Cloud API.
import { request } from 'undici';
import { FastifyBaseLogger } from 'fastify';
import { whatsappConfig, WhatsappConfig } from '../../config/whatsapp';

export class WhatsAppService {
  constructor(
    private readonly config: WhatsappConfig = whatsappConfig,
    private readonly logger?: FastifyBaseLogger,
  ) {}

  async sendText(to: string, body: string) {
    const url = `${this.config.baseUrl}/${this.config.phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to,
      text: { body },
    };

    const response = await request(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.statusCode >= 300) {
      const text = await response.body.text();
      this.logger?.error({ status: response.statusCode, text }, 'Failed to send WhatsApp message');
      throw new Error(`WhatsApp send failed with status ${response.statusCode}`);
    }

    this.logger?.info({ to }, 'WhatsApp message sent');
  }
}

