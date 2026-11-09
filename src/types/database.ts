export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FoodSource = 'manual' | 'ai_assisted';
export type QuestCategory = 'nutrition' | 'hydration' | 'sleep' | 'general';
export type QuestStatus = 'available' | 'completed';

export interface Profile {
  id: string;
  display_name: string;
  birth_year: number | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface FoodLog {
  id: string;
  user_id: string;
  meal_type: MealType;
  food_name: string;
  portion_description: string | null;
  calories_estimate: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  image_path: string | null;
  source: FoodSource;
  user_confirmed: boolean;
  logged_at: string;
  created_at: string;
}

export interface WaterLog {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
  created_at: string;
}

export interface SleepLog {
  id: string;
  user_id: string;
  bedtime: string;
  wake_time: string;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  points: number;
  rule_key: string;
  active: boolean;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_id: string;
  quest_date: string;
  status: QuestStatus;
  completed_at: string | null;
  quest?: Quest;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  points_delta: number;
  reason: string;
  reference_id: string | null;
  idempotency_key: string;
  created_at: string;
}

export interface NotificationSettings {
  user_id: string;
  line_user_id: string | null;
  line_linked_at: string | null;
  hydration_enabled: boolean;
  sleep_enabled: boolean;
  daily_summary_enabled: boolean;
  reminder_preferences: {
    hydration_interval_hours?: number;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
  };
  updated_at: string;
}
