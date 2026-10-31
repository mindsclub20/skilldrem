export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type BudgetPreference = "free_only" | "free_preferred" | "mixed" | "paid_ok";
export type PricingType =
  | "completely_free"
  | "free_with_conditions"
  | "free_audit"
  | "free_with_paid_certificate"
  | "paid"
  | "freemium"
  | "unknown";
export type ResourceType =
  | "course"
  | "book"
  | "ebook"
  | "ai_tool"
  | "website"
  | "tutorial"
  | "practice"
  | "project"
  | "community"
  | "documentation"
  | "video"
  | "other";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_admin: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  interests: string[];
  learning_goals: string[];
  experience_level: ExperienceLevel | null;
  preferred_language: string;
  available_hours_per_week: number | null;
  budget_preference: BudgetPreference | null;
  preferred_formats: string[];
  desired_duration: string | null;
}

export interface Journey {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: ExperienceLevel | null;
  target_outcome: string | null;
  estimated_hours: number | null;
  is_published: boolean;
  is_featured: boolean;
  cover_image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  journey_id: string;
  title: string;
  description: string | null;
  position: number;
  estimated_hours: number | null;
  node_type: "start" | "milestone" | "project" | "checkpoint" | "end";
  metadata: Record<string, unknown>;
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  resource_type: ResourceType;
  provider: string | null;
  language: string;
  pricing_type: PricingType | null;
  difficulty: string | null;
  duration_hours: number | null;
  has_certificate: boolean;
  is_verified: boolean;
  quality_score: number | null;
  is_published: boolean;
}
