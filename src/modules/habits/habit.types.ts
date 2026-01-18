// Shared habit domain types to keep controllers/services aligned.
export type HabitName = 'pushups' | 'situps' | 'squats' | 'walking' | 'other';

export interface HabitLogInput {
  userId: string;
  habit: HabitName;
  count: number;
  loggedAt?: Date;
  note?: string;
}

