// Heuristic intent parser stub (to be replaced by AI); converts free text -> structured intent.
export interface ParsedIntent {
  intent: 'LOG_HABIT' | 'GET_STATS' | 'SET_REMINDER' | 'UNKNOWN';
  habit?: string;
  count?: number;
  period?: 'today' | 'week';
}

const HABIT_KEYWORDS: Record<string, string> = {
  pushup: 'pushups',
  pushups: 'pushups',
  'push-up': 'pushups',
  'push-ups': 'pushups',
  squat: 'squats',
  squats: 'squats',
  situp: 'situps',
  situps: 'situps',
  'sit-up': 'situps',
  'sit-ups': 'situps',
  walk: 'walking',
  walking: 'walking',
};

const DEFAULT_HABIT = 'pushups';

export class IntentParser {
  parse(text: string): ParsedIntent {
    const sanitized = text.trim().toLowerCase();
    if (!sanitized) return { intent: 'UNKNOWN' };

    // If the text is purely numeric, treat as habit log with default habit.
    if (/^\d+$/.test(sanitized)) {
      return { intent: 'LOG_HABIT', habit: DEFAULT_HABIT, count: Number(sanitized) };
    }

    // Pattern: "<number> <habit>"
    const numberHabitMatch = sanitized.match(/(\d+)\s+([a-z-]+)/);
    if (numberHabitMatch) {
      const count = Number(numberHabitMatch[1]);
      const habit = resolveHabit(numberHabitMatch[2]);
      if (habit && count > 0) {
        return { intent: 'LOG_HABIT', habit, count };
      }
    }

    // Stats queries: "how many ... today/this week"
    if (sanitized.includes('how many') || sanitized.includes('stats')) {
      const period: ParsedIntent['period'] = sanitized.includes('week') ? 'week' : 'today';
      const habit = resolveHabitFromText(sanitized) ?? DEFAULT_HABIT;
      return { intent: 'GET_STATS', habit, period };
    }

    return { intent: 'UNKNOWN' };
  }
}

function resolveHabit(token: string): string | undefined {
  return HABIT_KEYWORDS[token] ?? undefined;
}

function resolveHabitFromText(text: string): string | undefined {
  const tokens = text.split(/\s+/);
  for (const token of tokens) {
    const habit = resolveHabit(token.replace(/[^\w-]/g, ''));
    if (habit) return habit;
  }
  return undefined;
}

