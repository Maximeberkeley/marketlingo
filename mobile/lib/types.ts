export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  selected_market: string | null;
  familiarity_level: string | null;
  is_pro_user: boolean;
  pro_plan_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  market_id: string;
  current_day: number | null;
  current_streak: number | null;
  longest_streak: number | null;
  last_activity_at: string | null;
  streak_expires_at: string | null;
  completed_stacks: string[] | null;
  start_date: string;
}

export interface UserXP {
  id: string;
  user_id: string;
  market_id: string;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  startup_stage: number;
}

export interface Stack {
  id: string;
  market_id: string;
  title: string;
  stack_type: string;
  tags: string[] | null;
  duration_minutes: number | null;
  published_at: string | null;
  created_at: string;
}

export interface Slide {
  id: string;
  stack_id: string;
  slide_number: number;
  title: string;
  body: string;
  sources: Json | null;
}

export interface StackWithSlides {
  id: string;
  title: string;
  stack_type: string;
  tags: string[];
  duration_minutes: number;
  slides: {
    slide_number: number;
    title: string;
    body: string;
    sources: { label: string; url: string }[];
  }[];
}

export interface Note {
  id: string;
  user_id: string;
  content: string;
  linked_label: string | null;
  market_id: string | null;
  slide_id: string | null;
  stack_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedInsight {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  slide_id: string | null;
  stack_id: string | null;
  created_at: string;
}

export interface DailyCompletion {
  id: string;
  user_id: string;
  market_id: string;
  completion_date: string;
  lesson_completed: boolean;
  completed_stack_id: string | null;
  games_completed: number;
  drills_completed: number;
  xp_earned: number;
}

export interface TrainerScenario {
  id: string;
  market_id: string;
  scenario: string;
  question: string;
  options: Json;
  correct_option_index: number;
  feedback_pro_reasoning: string | null;
  feedback_common_mistake: string | null;
  feedback_mental_model: string | null;
  follow_up_question: string | null;
  tags: string[] | null;
  sources: Json | null;
}

export interface InvestmentScenario {
  id: string;
  market_id: string;
  title: string;
  scenario: string;
  question: string;
  options: Json;
  correct_option_index: number;
  explanation: string | null;
  scenario_type: string;
  difficulty: string | null;
  real_world_example: string | null;
  valuation_model: string | null;
  tags: string[] | null;
}

export interface InvestmentLabProgress {
  id: string;
  user_id: string;
  market_id: string;
  investment_xp: number | null;
  investment_certified: boolean | null;
  watchlist_companies: Json | null;
}

export interface NewsItem {
  id: string;
  market_id: string;
  title: string;
  summary: string | null;
  source_name: string;
  source_url: string;
  image_url: string | null;
  category_tag: string | null;
  published_at: string;
}

export interface Summary {
  id: string;
  market_id: string;
  title: string;
  content: string;
  summary_type: string;
  for_date: string;
  key_takeaways: Json | null;
}

export interface Achievement {
  id: string;
  achievement_id: string;
  user_id: string;
  unlocked_at: string;
}

export interface Market {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  themes: string[];
}
