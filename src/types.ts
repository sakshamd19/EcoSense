export type CommuteMode = 'Car' | '2-Wheeler' | 'Auto' | 'Metro' | 'Bus' | 'WFH';
export type DietType = 'Vegan' | 'Vegetarian' | 'Mixed' | 'Non-Vegetarian';
export type Category = 'Transport' | 'Food' | 'Electricity' | 'Other';

export interface UserProfile {
  name: string;
  commuteMode: CommuteMode;
  commuteDistance: number; // km one-way
  dietType: DietType;
  electricityKwh: number;
  city?: string;
  baselineDailyKg: number;
  geminiApiKey?: string;
  lastUpdated?: string;
}

export interface ActivityLog {
  id: string;
  activity: string;
  category: Category;
  kg: number;
}

export interface DailyLogs {
  [dateString: string]: ActivityLog[]; // 'YYYY-MM-DD'
}

export const MONTHLY_BUDGET_KG = 191;
export const DAILY_BUDGET_KG = MONTHLY_BUDGET_KG / 30;
