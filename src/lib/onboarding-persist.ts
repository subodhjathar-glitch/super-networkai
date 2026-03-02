import { supabase } from "@/lib/supabase";

export async function saveIdentity(userId: string, identityType: string, intentTypes: string[]) {
  const { error } = await supabase.from("user_identity").upsert(
    {
      user_id: userId,
      identity_type: identityType,
      intent_types: intentTypes,
    },
    { onConflict: "user_id" }
  );
  if (error) {
    console.error("saveIdentity error:", error);
    throw error;
  }
}

export async function saveProfile(userId: string, data: {
  name: string;
  location_country: string;
  location_city: string;
  industries: string[];
  industry_other: string;
  skills: string[];
  linkedin?: string;
  twitter?: string;
  github?: string;
  portfolio?: string;
}) {
  const { error } = await supabase.from("profiles").update({
    name: data.name,
    location_country: data.location_country,
    location_city: data.location_city,
    industries: data.industries,
    industry_other: data.industry_other,
    core_skills: data.skills,
    linkedin_url: data.linkedin || null,
    twitter_url: data.twitter || null,
    github_url: data.github || null,
    portfolio_url: data.portfolio || null,
  }).eq("user_id", userId);

  if (error) {
    console.error("saveProfile error:", error);
    throw error;
  }
}

export async function saveIkigai(userId: string, ikigai: {
  love: string;
  good: string;
  world: string;
  livelihood: string;
}) {
  const { error } = await supabase.from("ikigai").upsert(
    {
      user_id: userId,
      love_text: ikigai.love,
      good_at_text: ikigai.good,
      world_needs_text: ikigai.world,
      livelihood_text: ikigai.livelihood,
    },
    { onConflict: "user_id" }
  );
  if (error) {
    console.error("saveIkigai error:", error);
    throw error;
  }
}

// Whitelist of valid personality DB columns to prevent unknown-column errors
const PERSONALITY_COLUMNS = new Set([
  "working_style", "working_style_other", "working_style_detail",
  "stress_response", "stress_response_other",
  "recognition_style", "recognition_style_other",
  "communication_style", "communication_depth", "communication_rhythm",
  "conflict_style", "conflict_detail",
  "trust_style", "trust_style_other", "trust_style_detail",
  "work_life_balance", "work_life_balance_other",
  "mission_priority", "mission_priority_other", "mission_priority_detail",
  "vision_flexibility", "vision_flexibility_other", "vision_flexibility_detail",
  "decision_structure", "decision_speed",
  "commitment_type", "commitment_consistency", "commitment_consistency_other",
  "financial_runway", "long_term_vision",
  "equity_expectations", "equity_expectations_other",
  "past_collaboration", "past_collab_exp",
  "ownership_style",
  "feedback_style", "feedback_style_other", "feedback_style_detail",
  "leadership_pref", "leadership_pref_other",
  "autonomy_level",
  "adaptability", "adaptability_other",
  "motivation_style", "motivation_style_other",
  "assertiveness", "assertiveness_other",
  "ideal_environment", "startup_readiness",
  "dealbreakers", "non_negotiables",
  "involvement_pref", "relationship_style",
  "scope_clarity",
  "budget_philosophy", "budget_philosophy_other",
  "timeline_style", "success_criteria",
  "step_back_reason",
]);

export async function savePersonality(userId: string, answers: Record<string, any>) {
  // Filter out internal keys
  const { _intent, ...rest } = answers;
  
  const payload: Record<string, any> = { user_id: userId };
  
  // Only include keys that are valid DB columns
  for (const [key, value] of Object.entries(rest)) {
    if (!PERSONALITY_COLUMNS.has(key)) continue;
    if (value !== undefined && value !== "") {
      if (Array.isArray(value)) {
        payload[key] = value;
      } else {
        payload[key] = String(value);
      }
    }
  }

  const { error } = await supabase.from("personality").upsert(
    payload as any,
    { onConflict: "user_id" }
  );
  if (error) {
    console.error("savePersonality error:", error);
    throw error;
  }
}

export async function triggerEmbeddingGeneration() {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-embedding`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  );
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown" }));
    console.error("Embedding generation error:", err);
    // Don't throw - embedding is best-effort
  }
}
