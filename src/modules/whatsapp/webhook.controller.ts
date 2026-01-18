// WhatsApp webhook routes: verification handshake and payload intake logging.
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../../config/env';
import { IntentParser } from '../ai/intent.parser';
import { HabitRepository } from '../habits/habit.repository';
import { HabitService } from '../habits/habit.service';
import { WhatsAppService } from './whatsapp.service';
import { whatsappConfig } from '../../config/whatsapp';
import { StatsService } from '../stats/stats.service';

// Schema for the WhatsApp webhook payload (simplified for inbound messages).
const webhookBodySchema = z.object({
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          value: z.object({
            messages: z
              .array(
                z.object({
                  from: z.string(),
                  text: z.object({ body: z.string() }).optional(),
                }),
              )
              .optional(),
            contacts: z
              .array(
                z.object({
                  wa_id: z.string(),
                  profile: z.object({ name: z.string().optional() }).optional(),
                }),
              )
              .optional(),
          }),
        }),
      ),
    }),
  ),
});

// Query params schema for the Meta webhook verification handshake.
const verifyQuerySchema = z.object({
  'hub.mode': z.string().optional(),
  'hub.verify_token': z.string().optional(),
  'hub.challenge': z.string().optional(),
});

export default async function webhookController(fastify: FastifyInstance) {
  // Instantiate shared helpers once per plugin registration.
  const intentParser = new IntentParser();
  const habitRepository = new HabitRepository(fastify.prisma);
  const habitService = new HabitService(habitRepository);
  const statsService = new StatsService(habitRepository);
  const waService = new WhatsAppService(whatsappConfig, fastify.log);

  // Meta/WhatsApp verification + health check at the same endpoint.
  // Meta sends GET with hub.* params for verification; otherwise returns status.
  fastify.get('/', async (request, reply) => {
    const parsed = verifyQuerySchema.safeParse(request.query);
    const mode = parsed.data?.['hub.mode'];
    const token = parsed.data?.['hub.verify_token'];
    const challenge = parsed.data?.['hub.challenge'];

    // If verification params present, handle Meta webhook verification
    if (mode === 'subscribe' && token && challenge) {
      if (token === env.WHATSAPP_VERIFY_TOKEN) {
        fastify.log.info('WhatsApp webhook verified');
        return reply.type('text/plain').send(challenge);
      }
      fastify.log.warn({ mode, tokenProvided: Boolean(token) }, 'Invalid WhatsApp webhook verification attempt');
      return reply.status(403).send({ error: 'Invalid verify token' });
    }

    // Otherwise return health/status
    return {
      status: 'webhook-ready',
      verifyTokenConfigured: Boolean(env.WHATSAPP_VERIFY_TOKEN),
    };
  });

  // Primary webhook receiver; parses message, logs, and responds via WhatsApp API.
  fastify.post('/', async (request, reply) => {
    const parsedBody = webhookBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      fastify.log.warn({ error: parsedBody.error }, 'Invalid WhatsApp webhook payload');
      return reply.status(400).send({ error: 'Invalid payload' });
    }

    const change = parsedBody.data.entry[0]?.changes[0];
    const message = change?.value?.messages?.[0];
    const contact = change?.value?.contacts?.[0];

    if (!message?.text?.body || !message.from) {
      fastify.log.info('Webhook received non-text or empty message; ignoring');
      return reply.status(200).send({ received: true });
    }

    const phone = message.from;
    const text = message.text.body;
    const displayName = contact?.profile?.name;

    fastify.log.info({ phone, text }, 'Incoming WhatsApp message');

    const intent = intentParser.parse(text);

    if (intent.intent === 'LOG_HABIT' && intent.count && intent.habit) {
      try {
        const result = await habitService.logHabit({
          phone,
          displayName,
          habit: intent.habit,
          count: intent.count,
          source: 'WHATSAPP',
        });

        const replyText = `Logged ${intent.count} ${intent.habit}. Today total: ${result.todayTotal}.`;
        await waService.sendText(phone, replyText);
      } catch (error) {
        fastify.log.error({ err: error }, 'Failed to log habit');
        await waService.sendText(phone, 'Sorry, we could not log that right now.');
      }
    } else if (intent.intent === 'GET_STATS' && intent.habit) {
      const user = await habitRepository.upsertUserByPhone(phone, displayName);
      const total =
        intent.period === 'week'
          ? await statsService.getWeekTotal({ userId: user.id, habit: intent.habit, timezone: user.timezone })
          : await statsService.getTodayTotal({ userId: user.id, habit: intent.habit, timezone: user.timezone });

      const periodLabel = intent.period === 'week' ? 'this week' : 'today';
      await waService.sendText(phone, `You have logged ${total} ${intent.habit} ${periodLabel}.`);
    } else {
      await waService.sendText(phone, 'Please send a number to log your habit (e.g., "30").');
    }

    return reply.status(200).send({ received: true });
  });
}

