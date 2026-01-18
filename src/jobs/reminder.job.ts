// Cron registrations for reminders and summaries.
import cron from 'node-cron';
import { FastifyInstance } from 'fastify';
import { env } from '../config/env';
import { ReminderRepository } from '../modules/reminders/reminder.repository';
import { ReminderService } from '../modules/reminders/reminder.service';
import { WhatsAppService } from '../modules/whatsapp/whatsapp.service';
import { whatsappConfig } from '../config/whatsapp';
import { HabitRepository } from '../modules/habits/habit.repository';
import { StatsService } from '../modules/stats/stats.service';

export const registerReminderJobs = (app: FastifyInstance) => {
  const reminderRepo = new ReminderRepository(app.prisma);
  const habitRepo = new HabitRepository(app.prisma);
  const waService = new WhatsAppService(whatsappConfig, app.log);
  const reminderService = new ReminderService(reminderRepo, waService);
  const statsService = new StatsService(habitRepo);

  cron.schedule(env.REMINDER_CRON, async () => {
    try {
      await reminderService.sendDueReminders(new Date());
    } catch (error) {
      app.log.error({ err: error }, 'Reminder cron failed');
    }
  });

  cron.schedule(env.DAILY_SUMMARY_CRON, async () => {
    try {
      await sendSummaries({ period: 'day', app, statsService, waService });
    } catch (error) {
      app.log.error({ err: error }, 'Daily summary cron failed');
    }
  });

  cron.schedule(env.WEEKLY_SUMMARY_CRON, async () => {
    try {
      await sendSummaries({ period: 'week', app, statsService, waService });
    } catch (error) {
      app.log.error({ err: error }, 'Weekly summary cron failed');
    }
  });
};

async function sendSummaries(params: {
  period: 'day' | 'week';
  app: FastifyInstance;
  statsService: StatsService;
  waService: WhatsAppService;
}) {
  const { period, app, statsService, waService } = params;
  const now = new Date();

  const userIds =
    period === 'week'
      ? await statsService.getUsersWithLogsThisWeek({ timezone: 'UTC', asOf: now })
      : await statsService.getUsersWithLogsToday({ timezone: 'UTC', asOf: now });

  for (const userId of userIds) {
    const user = await app.prisma.user.findUnique({ where: { id: userId } });
    if (!user) continue;

    const summary =
      period === 'week'
        ? await statsService.getWeeklySummary({ userId, timezone: user.timezone, asOf: now })
        : await statsService.getDailySummary({ userId, timezone: user.timezone, asOf: now });

    if (!summary.length) continue;

    const lines = summary.map((item) => `${item.habit}: ${item._sum.count ?? 0}`).join('\n');
    const header = period === 'week' ? 'Your weekly summary' : 'Your daily summary';
    const message = `${header}:\n${lines}`;

    await waService.sendText(user.phone, message);
  }
}

