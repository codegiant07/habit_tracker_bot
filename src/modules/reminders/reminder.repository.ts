// Repository for reminders; CRUD and lookup for active reminders with user context.
import { PrismaClient, Prisma } from '@prisma/client';

export class ReminderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getActiveReminders() {
    return this.prisma.reminder.findMany({
      where: { active: true },
      include: { user: true },
    });
  }

  async markSent(reminderId: string, sentAt: Date) {
    await this.prisma.reminder.update({
      where: { id: reminderId },
      data: { lastSentAt: sentAt },
    });
  }
}

