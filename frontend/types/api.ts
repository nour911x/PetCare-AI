export type Species = "chien" | "chat";

export type EmotionLabel =
  | "heureux"
  | "calme"
  | "joueur"
  | "stresse"
  | "anxieux"
  | "en_colere"
  | "triste"
  | "peur"
  | "fatigue"
  | "neutre";

export type IntensityLabel = "faible" | "moderee" | "elevee";

export type UrgencyLevel = "vert" | "jaune" | "orange" | "rouge";

export type RecommendationLevel =
  | "aucune_action"
  | "surveiller"
  | "consulter_bientot"
  | "urgence_veto";

export interface Source {
  topic: string | null;
  species: string | null;
  excerpt: string;
}

export interface EmotionData {
  emotion: EmotionLabel;
  intensity: IntensityLabel;
  confidence: number;
  reasoning: string;
  observed_signals: string[];
  emoji?: string;
  color?: string;
}

export interface HealthData {
  urgency: UrgencyLevel;
  recommendation: RecommendationLevel;
  confidence: number;
  potential_concerns: string[];
  reasoning: string;
  when_to_consult: string;
  emoji?: string;
  color?: string;
  urgency_label?: string;
  recommendation_label?: string;
}

export interface VideoAnalysisData {
  duration_s: number;
  activity_score: number;
  displacement: number;
  detection_rate: number;
  n_frames_extracted: number;
  key_frame_descriptions: string[];
  temporal_narrative: string;
}

export interface AnalysisResponse {
  id: number | null;
  answer: string;
  emotion: EmotionData | null;
  health: HealthData | null;
  image_description: string | null;
  video_analysis: VideoAnalysisData | null;
  sources: Source[];
}

export interface HistoryItem {
  id: number;
  created_at: string;
  species: Species;
  breed: string | null;
  pet_name: string | null;
  question: string | null;
  image_path: string | null;
  video_path: string | null;
  vision_description: string | null;
  video_metrics: Record<string, number> | null;
  emotion_data: EmotionData | null;
  health_data: HealthData | null;
  answer: string;
  sources_used: Source[];
}

export interface StatsResponse {
  total: number;
  chiens: number;
  chats: number;
  with_photos: number;
  emotion_distribution: Record<string, number>;
  urgency_distribution: Record<string, number>;
  pet_names: string[];
}

export type PetSex = "male" | "femelle" | "inconnu";

export interface Pet {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  species: Species;
  breed: string | null;
  sex: PetSex | null;
  birthdate: string | null;
  weight_kg: number | null;
  sterilized: boolean | null;
  allergies: string[];
  medical_notes: string | null;
  avatar_path: string | null;
  age_years: number | null;
  age_label: string | null;
}

export interface PetInput {
  name: string;
  species: Species;
  breed?: string | null;
  sex?: PetSex | null;
  birthdate?: string | null;
  weight_kg?: number | null;
  sterilized?: boolean | null;
  allergies?: string[];
  medical_notes?: string | null;
}

export interface WeightEntry {
  id: number;
  pet_id: number;
  date: string;
  weight_kg: number;
  note: string | null;
  created_at: string;
}

export interface WeightEntryInput {
  weight_kg: number;
  date?: string | null;
  note?: string | null;
}

export type WeightDirection = "hausse" | "baisse" | "stable" | "insuffisant";

export interface WeightInsights {
  count: number;
  latest_kg: number | null;
  first_kg: number | null;
  change_kg: number | null;
  change_pct: number | null;
  direction: WeightDirection;
  anomalies: string[];
}

export interface WeightHistory {
  pet_id: number;
  entries: WeightEntry[];
  insights: WeightInsights;
}

export type ReminderCategory = "vaccin" | "vermifuge" | "visite" | "autre";
export type ReminderStatus = "en_retard" | "bientot" | "a_venir" | "fait";

export interface Reminder {
  id: number;
  pet_id: number;
  title: string;
  category: ReminderCategory;
  due_date: string;
  notes: string | null;
  done: boolean;
  status: ReminderStatus;
  days_until: number | null;
  created_at: string;
}

export interface ReminderInput {
  pet_id: number;
  title: string;
  category: ReminderCategory;
  due_date: string;
  notes?: string | null;
}

export interface ReminderUpdate {
  title?: string;
  category?: ReminderCategory;
  due_date?: string;
  notes?: string | null;
  done?: boolean;
}

export interface MonthlyCount {
  month: string;
  count: number;
}

export type InsightTone = "positive" | "warning" | "neutral";

export interface InsightHighlight {
  type: string;
  tone: InsightTone;
  text: string;
}

export interface InsightsResponse {
  total: number;
  this_month: number;
  last_month: number;
  trend_pct: number | null;
  top_emotion: string | null;
  top_emotion_count: number;
  emotion_distribution: Record<string, number>;
  monthly_counts: MonthlyCount[];
  highlights: InsightHighlight[];
  pet_names: string[];
}

export interface OnboardingStep {
  id: string;
  text: string;
  category: string | null;
}

export interface OnboardingPhase {
  id: string;
  title: string;
  emoji: string;
  steps: OnboardingStep[];
}

export interface OnboardingPlan {
  species: Species;
  age_category: string;
  phases: OnboardingPhase[];
  breed_tips: string[];
}

export interface BreedBenchmark {
  breed: string;
  species: string | null;
  sample_size: number;
  emotion_distribution: Record<string, number>;
  emotion_percentages: Record<string, number>;
  typical_traits: string[];
  highlights: string[];
}
