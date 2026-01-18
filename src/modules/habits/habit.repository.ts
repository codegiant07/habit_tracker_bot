// Repository layer for habit persistence; uses Prisma via Fastify context.
import { PrismaClient } from '@prisma/client';

type LogSource = 'WHATSAPP' | 'SYSTEM';

type CreateLogInput = {
  userId: string;
  habit: string;
  count: number;
  loggedAt?: Date;
  source: LogSource;
  note?: string;
};

export class HabitRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertUserByPhone(phone: string, name?: string, timezone?: string) {
    return this.prisma.user.upsert({
      where: { phone },
      update: {
        name: name ?? undefined,
        timezone: timezone ?? undefined,
      },
      create: {
        phone,
        name,
        timezone: timezone ?? 'UTC',
      },
    });
  }

  async createLog(input: CreateLogInput) {
    return this.prisma.habitLog.create({
      data: {
        userId: input.userId,
        habit: input.habit,
        count: input.count,
        loggedAt: input.loggedAt ?? new Date(),
        source: input.source,
        note: input.note,
      },
    });
  }

  async getHabitTotalForDay(params: { userId: string; habit: string; asOf: Date; timezone: string }): Promise<number> {
    const { start, end } = getDayBounds(params.asOf, params.timezone);
    return this.getHabitTotalForRange({ userId: params.userId, habit: params.habit, start, end });
  }

  async getHabitTotalForWeek(params: { userId: string; habit: string; asOf: Date; timezone: string }): Promise<number> {
    const { start, end } = getWeekBounds(params.asOf, params.timezone);
    return this.getHabitTotalForRange({ userId: params.userId, habit: params.habit, start, end });
  }

  async getHabitTotalForRange(params: { userId: string; habit: string; start: Date; end: Date }): Promise<number> {
    const aggregate = await this.prisma.habitLog.aggregate({
      where: {
        userId: params.userId,
        habit: params.habit,
        loggedAt: { gte: params.start, lt: params.end },
      },
      _sum: { count: true },
    });

    return aggregate._sum.count ?? 0;
  }

  async getHabitTotalsGroupedForRange(params: { userId: string; start: Date; end: Date }) {
    return this.prisma.habitLog.groupBy({
      by: ['habit'],
      where: {
        userId: params.userId,
        loggedAt: { gte: params.start, lt: params.end },
      },
      _sum: { count: true },
    });
  }

  async getUsersWithLogsInRange(params: { start: Date; end: Date }): Promise<string[]> {
    const rows = await this.prisma.habitLog.groupBy({
      by: ['userId'],
      where: {
        loggedAt: { gte: params.start, lt: params.end },
      },
    });
    return rows.map((r) => r.userId);
  }
}

// Compute start/end of day for a given timezone by extracting date parts with Intl.
function getDayBounds(reference: Date, timeZone: string): { start: Date; end: Date } {
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

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);

  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0));

  return { start, end };
}

// Compute start/end of ISO week (Mon-Sun) in a timezone.
function getWeekBounds(reference: Date, timeZone: string): { start: Date; end: Date } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });

  const parts = formatter.formatToParts(reference).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const weekday = (parts.weekday ?? 'Sun').toLowerCase();

  const weekdayIndex = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(weekday);
  const daysFromMonday = (weekdayIndex + 6) % 7; // Monday => 0, Sunday => 6

  const localMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const start = new Date(localMidnight.getTime() - daysFromMonday * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  return { start, end };
}

export { getDayBounds, getWeekBounds };

