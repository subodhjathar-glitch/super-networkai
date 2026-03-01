import { supabase } from "@/integrations/supabase/client";

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

export async function savePersonality(userId: string, answers: Record<string, any>) {
  // Filter out internal keys
  const { _intent, ...rest } = answers;
  
  const payload: Record<string, any> = { user_id: userId };
  
  // Map answer keys to personality columns
  for (const [key, value] of Object.entries(rest)) {
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
