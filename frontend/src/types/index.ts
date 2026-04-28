export interface Profile {
  id: string;
  full_name: string;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  goal: 'lose' | 'gain' | 'maintain';
  daily_calorie_goal: number;
  created_at: string;
  updated_at: string;
}

export interface Food {
  id: string;
  name: string;
  category: string;
  calories: number;       // per 100g
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  serving_unit: string;
  default_serving: number;
  is_custom?: boolean;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodLog {
  id: string;
  user_id: string;
  food_id: string;
  food_name: string;
  meal_type: MealType;
  quantity: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  log_date: string;
  created_at: string;
}

export interface DailySummary {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  entries: number;
}

export interface WaterLog {
  glasses: number;
  goal: number;
}

export interface LogFoodInput {
  food_id: string;
  meal_type: MealType;
  quantity: number;
  log_date: string;
  // Custom entry overrides (AI scan, recommendations)
  food_name?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
}

// ─── Workouts ─────────────────────────────────────────────────────────────────

export type WorkoutType = 'weights' | 'cardio' | 'bjj_mma' | 'other';

export interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  duration_min?: number;
  distance_km?: number;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_type: WorkoutType;
  name: string;
  duration_min: number;
  calories_burned: number;
  exercises: Exercise[];
  log_date: string;
  created_at: string;
}

export interface WorkoutSummary {
  total_calories_burned: number;
  total_duration_min: number;
  sessions: number;
}

export interface LogWorkoutInput {
  workout_type: WorkoutType;
  name: string;
  duration_min: number;
  exercises: Exercise[];
  log_date: string;
  body_weight_kg?: number;
  is_shared?: boolean;
  caption?: string;
}

// ─── Social ───────────────────────────────────────────────────────────────────

export interface FeedItem {
  id: string;
  user_id: string;
  user_name: string;
  workout_type: string;
  workout_emoji: string;
  name: string;
  duration_min: number;
  calories_burned: number;
  exercise_count: number;
  caption: string | null;
  log_date: string;
  created_at: string;
  likes_count: number;
  liked_by_me: boolean;
}

export interface SocialUser {
  id: string;
  full_name: string;
  is_following: boolean;
}

export interface FollowStats {
  followers: number;
  following: number;
}

// ─── Health ───────────────────────────────────────────────────────────────────

export interface HealthCondition {
  id: string;
  label: string;
  emoji: string;
}

export interface DietRecommendation {
  condition_id: string;
  title: string;
  summary: string;
  eat_more: string[];
  limit: string[];
  tips: string[];
  calorie_note: string;
}
