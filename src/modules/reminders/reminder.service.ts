// Reminder service: decides when to send reminders and triggers WhatsApp sends.
import { ReminderRepository } from './reminder.repository';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

export class ReminderService {
  constructor(private readonly repo: ReminderRepository, private readonly waService: WhatsAppService) {}

  async sendDueReminders(now: Date = new Date()) {
    const reminders = await this.repo.getActiveReminders();

    for (const reminder of reminders) {
      if (!isWithinWindow(now, reminder.timezone, reminder.windowStart, reminder.windowEnd)) continue;
      if (isRecentlySent(reminder.lastSentAt, reminder.timezone, reminder.windowStart)) continue;

      const habitLabel = reminder.habit ?? 'your habit';
      const message = `Reminder: log ${habitLabel} now.`;
      await this.waService.sendText(reminder.user.phone, message);
      await this.repo.markSent(reminder.id, now);
    }
  }
}

function isWithinWindow(nowUtc: Date, timeZone: string, windowStart?: string | null, windowEnd?: string | null) {
  if (!windowStart || !windowEnd) return true;

  const { hour: startH, minute: startM } = parseHm(windowStart);
  const { hour: endH, minute: endM } = parseHm(windowEnd);

  const nowParts = getLocalHm(nowUtc, timeZone);

  const nowMinutes = nowParts.hour * 60 + nowParts.minute;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
}

function isRecentlySent(lastSentAt: Date | null, timeZone: string, windowStart?: string | null) {
  if (!lastSentAt) return false;
  if (!windowStart) return false;

  const windowStartDate = buildLocalDateAtHm(lastSentAt, timeZone, windowStart);
  return lastSentAt >= windowStartDate;
}

function parseHm(value: string) {
  const [h, m] = value.split(':').map(Number);
  return { hour: h ?? 0, minute: m ?? 0 };
}

function getLocalHm(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});
  return { hour: Number(parts.hour), minute: Number(parts.minute) };
}

function buildLocalDateAtHm(reference: Date, timeZone: string, hm: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(reference).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  const [hour, minute] = hm.split(':').map(Number);
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);

  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
}



