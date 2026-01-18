// Stats service: aggregates habit counts for day/week per user + habit.
import { HabitRepository, getDayBounds, getWeekBounds } from '../habits/habit.repository';

export class StatsService {
  constructor(private readonly repo: HabitRepository) {}

  async getTodayTotal(params: { userId: string; habit: string; asOf?: Date; timezone: string }) {
    return this.repo.getHabitTotalForDay({
      userId: params.userId,
      habit: params.habit,
      asOf: params.asOf ?? new Date(),
      timezone: params.timezone,
    });
  }

  async getWeekTotal(params: { userId: string; habit: string; asOf?: Date; timezone: string }) {
    return this.repo.getHabitTotalForWeek({
      userId: params.userId,
      habit: params.habit,
      asOf: params.asOf ?? new Date(),
      timezone: params.timezone,
    });
  }

  async getDailySummary(params: { userId: string; timezone: string; asOf?: Date }) {
    const now = params.asOf ?? new Date();
    const { start, end } = getDayBounds(now, params.timezone);
    return this.repo.getHabitTotalsGroupedForRange({ userId: params.userId, start, end });
  }

  async getWeeklySummary(params: { userId: string; timezone: string; asOf?: Date }) {
    const now = params.asOf ?? new Date();
    const { start, end } = getWeekBounds(now, params.timezone);
    return this.repo.getHabitTotalsGroupedForRange({ userId: params.userId, start, end });
  }

  async getUsersWithLogsToday(params: { timezone: string; asOf?: Date }) {
    const now = params.asOf ?? new Date();
    const { start, end } = getDayBounds(now, params.timezone);
    return this.repo.getUsersWithLogsInRange({ start, end });
  }

  async getUsersWithLogsThisWeek(params: { timezone: string; asOf?: Date }) {
    const now = params.asOf ?? new Date();
    const { start, end } = getWeekBounds(now, params.timezone);
    return this.repo.getUsersWithLogsInRange({ start, end });
  }
}

