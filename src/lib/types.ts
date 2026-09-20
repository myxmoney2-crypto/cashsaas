export type Tier = "starter" | "pro" | "premium";

export type SubscriptionStatus =
  | "none"
  | "active"
  | "past_due"
  | "canceled";

export type Profile = {
  id: string;
  email: string;
  stripe_customer_id: string | null;
  subscription_tier: Tier | null;
  subscription_status: SubscriptionStatus;
  created_at: string;
};

export type QuestionnaireAnswers = Record<string, string | number>;

export type QuestionnaireResponse = {
  id: string;
  user_id: string;
  answers: QuestionnaireAnswers;
  submitted_at: string;
};

export type GeneratedCodeFile = {
  path: string;
  content: string;
};

export type GenerationResult = {
  idea_name: string;
  niche: string;
  pitch: string;
  tech_stack: string[];
  code_files: GeneratedCodeFile[];
  tools_recommendation: string;
  acquisition_plan: { week: number; title: string; description: string }[];
};

export type GenerationStatus = "pending" | "done" | "failed";

export type Generation = {
  id: string;
  user_id: string;
  tier: Tier;
  status: GenerationStatus;
  error: string | null;
  checkout_session_id: string | null;
  idea_name: string | null;
  niche: string | null;
  prompt_text: string | null;
  result: GenerationResult | null;
  code_repo_url: string | null;
  created_at: string;
};

export type RegenerationsUsage = {
  user_id: string;
  month: string;
  count: number;
};
