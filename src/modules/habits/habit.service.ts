// Service layer for habit business rules (validation, totals, defaults).
import { HabitRepository } from './habit.repository';

const DEFAULT_HABIT = 'pushups';
type LogSource = 'WHATSAPP' | 'SYSTEM';

interface LogHabitParams {
  phone: string;
  displayName?: string;
  habit: string;
  count: number;
  source: LogSource;
  timezone?: string;
}

export class HabitService {
  constructor(private readonly repo: HabitRepository) {}

  async logHabit(params: LogHabitParams) {
    if (params.count <= 0) {
      throw new Error('Count must be greater than zero');
    }

    const user = await this.repo.upsertUserByPhone(params.phone, params.displayName, params.timezone);

    const log = await this.repo.createLog({
      userId: user.id,
      habit: params.habit || DEFAULT_HABIT,
      count: params.count,
      source: params.source,
    });

    const todayTotal = await this.repo.getHabitTotalForDay({
      userId: user.id,
      habit: log.habit,
      asOf: new Date(),
      timezone: user.timezone,
    });

    return { user, log, todayTotal };
  }
}

