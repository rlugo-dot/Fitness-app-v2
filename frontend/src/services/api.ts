import axios from 'axios';
import { supabase } from '../lib/supabase';
import type {
  Profile,
  Food,
  FoodLog,
  DailySummary,
  WaterLog,
  LogFoodInput,
  WorkoutLog,
  WorkoutSummary,
  LogWorkoutInput,
  HealthCondition,
  DietRecommendation,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Profile ──────────────────────────────────────────────────────────────────
export const getProfile = () =>
  api.get<Profile>('/profile/me').then((r) => r.data);

export const updateProfile = (data: Partial<Profile>) =>
  api.patch<Profile>('/profile/me', data).then((r) => r.data);

// ─── Foods ────────────────────────────────────────────────────────────────────
export const searchFoods = (q?: string, category?: string) =>
  api.get<Food[]>('/foods', { params: { q, category } }).then((r) => r.data);

export const getFoodCategories = () =>
  api.get<string[]>('/foods/categories').then((r) => r.data);

// ─── Meals ────────────────────────────────────────────────────────────────────
export const getMeals = (log_date: string) =>
  api.get<FoodLog[]>('/meals', { params: { log_date } }).then((r) => r.data);

export const logFood = (data: LogFoodInput) =>
  api.post<FoodLog>('/meals', data).then((r) => r.data);

export const deleteMealLog = (id: string) =>
  api.delete(`/meals/${id}`);

export const getDailySummary = (log_date: string) =>
  api.get<DailySummary>('/meals/summary', { params: { log_date } }).then((r) => r.data);

// ─── Water ────────────────────────────────────────────────────────────────────
export const getWater = (log_date: string) =>
  api.get<WaterLog>('/water', { params: { log_date } }).then((r) => r.data);

export const updateWater = (glasses: number, log_date: string) =>
  api.put<WaterLog>('/water', { glasses, log_date }).then((r) => r.data);

// ─── Workouts ─────────────────────────────────────────────────────────────────
export const getWorkouts = (log_date: string) =>
  api.get<WorkoutLog[]>('/workouts', { params: { log_date } }).then((r) => r.data);

export const logWorkout = (data: LogWorkoutInput) =>
  api.post<WorkoutLog>('/workouts', data).then((r) => r.data);

export const deleteWorkout = (id: string) =>
  api.delete(`/workouts/${id}`);

export const getWorkoutSummary = (log_date: string) =>
  api.get<WorkoutSummary>('/workouts/summary', { params: { log_date } }).then((r) => r.data);

// ─── Food Scan ────────────────────────────────────────────────────────────────
export interface ScanResult {
  food_name: string;
  confidence: string;
  portion_description: string;
  estimated_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  notes: string;
}

export const scanFood = (image_base64: string, image_type: string) =>
  api.post<ScanResult>('/food-scan', { image_base64, image_type }).then((r) => r.data);

// ─── Weight ───────────────────────────────────────────────────────────────────
export interface WeightLog {
  id: string;
  weight_kg: number;
  body_fat_pct: number | null;
  notes: string | null;
  logged_at: string;
  created_at: string;
}

export const getWeightLogs = (limit = 30) =>
  api.get<WeightLog[]>('/weight', { params: { limit } }).then((r) => r.data);

export const logWeight = (data: { weight_kg: number; body_fat_pct?: number; notes?: string; logged_at?: string }) =>
  api.post<WeightLog>('/weight', data).then((r) => r.data);

export const deleteWeightLog = (id: string) =>
  api.delete(`/weight/${id}`);

// ─── Integrations ─────────────────────────────────────────────────────────────
export interface IntegrationStatus {
  provider: string;
  connected: boolean;
  connected_at: string | null;
}

export interface OuraDaily {
  date: string;
  readiness_score: number | null;
  sleep_score: number | null;
  activity_score: number | null;
  hrv_average: number | null;
  resting_heart_rate: number | null;
  calories_active: number | null;
  steps: number | null;
  sleep_hours: number | null;
}

export const getIntegrationStatus = () =>
  api.get<IntegrationStatus[]>('/integrations/status').then((r) => r.data);

export const connectIntegration = (provider: string, access_token: string) =>
  api.post<IntegrationStatus>('/integrations/connect', { provider, access_token }).then((r) => r.data);

export const disconnectIntegration = (provider: string) =>
  api.delete(`/integrations/${provider}`);

export const getOuraToday = (for_date?: string) =>
  api.get<OuraDaily>('/integrations/oura/today', { params: { for_date } }).then((r) => r.data);

// ─── Professionals ────────────────────────────────────────────────────────────
export interface Professional {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  bio: string;
  rate_php: number;
  location: string;
  years_exp: number;
  avatar_emoji: string;
  avatar_color: string;
  is_available: boolean;
}

export interface BookingOut {
  id: string;
  professional_id: string;
  message: string;
  preferred_date: string | null;
  status: string;
  created_at: string;
}

export const getProfessionals = (specialty?: string, q?: string) =>
  api.get<Professional[]>('/professionals', { params: { specialty, q } }).then((r) => r.data);

export const getProfessionalSpecialties = () =>
  api.get<string[]>('/professionals/specialties').then((r) => r.data);

export const bookProfessional = (data: { professional_id: string; message: string; preferred_date?: string }) =>
  api.post<BookingOut>('/professionals/book', data).then((r) => r.data);

export const getMyBookings = () =>
  api.get<BookingOut[]>('/professionals/my-bookings').then((r) => r.data);

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface DayStats {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  entries: number;
}

export interface WorkoutDayStats {
  date: string;
  sessions: number;
  calories_burned: number;
  duration_min: number;
}

export interface AnalyticsOverview {
  days: DayStats[];
  workout_days: WorkoutDayStats[];
  streak: number;
  longest_streak: number;
  avg_calories: number;
  avg_protein_g: number;
  avg_carbs_g: number;
  avg_fat_g: number;
  total_workouts: number;
  total_calories_burned: number;
  calorie_goal: number;
}

export const getAnalyticsOverview = (days: number = 7) =>
  api.get<AnalyticsOverview>('/analytics/overview', { params: { days } }).then((r) => r.data);

// ─── Recommendations ──────────────────────────────────────────────────────────
export interface MealSuggestion {
  name: string;
  where: string;
  type: 'restaurant' | 'recipe' | 'store';
  price_php: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  why: string;
  tip: string | null;
}

export interface RecommendationsResponse {
  meal_type: string;
  remaining_calories: number;
  remaining_protein_g: number;
  remaining_carbs_g: number;
  remaining_fat_g: number;
  suggestions: MealSuggestion[];
}

export const getRecommendations = (log_date?: string, meal_type?: string) =>
  api.get<RecommendationsResponse>('/recommendations', { params: { log_date, meal_type } }).then((r) => r.data);

// ─── Social ───────────────────────────────────────────────────────────────────
import type { FeedItem, SocialUser, FollowStats } from '../types';

export const getFeed = (limit = 20) =>
  api.get<FeedItem[]>('/social/feed', { params: { limit } }).then((r) => r.data);

export const searchUsers = (q: string) =>
  api.get<SocialUser[]>('/social/users', { params: { q } }).then((r) => r.data);

export const followUser = (userId: string) =>
  api.post(`/social/follow/${userId}`);

export const unfollowUser = (userId: string) =>
  api.delete(`/social/follow/${userId}`);

export const getFollowStats = () =>
  api.get<FollowStats>('/social/follow-stats').then((r) => r.data);

export const likeWorkout = (workoutId: string) =>
  api.post(`/social/like/${workoutId}`);

export const unlikeWorkout = (workoutId: string) =>
  api.delete(`/social/like/${workoutId}`);

// ─── Health ───────────────────────────────────────────────────────────────────
export const getHealthConditions = () =>
  api.get<HealthCondition[]>('/health/conditions').then((r) => r.data);

export const getMyConditions = () =>
  api.get<{ conditions: string[] }>('/health/my-conditions').then((r) => r.data);

export const updateMyConditions = (conditions: string[]) =>
  api.put<{ conditions: string[] }>('/health/my-conditions', { conditions }).then((r) => r.data);

export const getDietRecommendations = () =>
  api.get<DietRecommendation[]>('/health/recommendations').then((r) => r.data);
