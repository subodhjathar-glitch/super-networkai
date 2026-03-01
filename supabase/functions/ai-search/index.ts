import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "for", "with", "from", "that", "this", "those", "these",
  "who", "what", "where", "when", "why", "how", "someone", "person", "people", "looking",
  "need", "wants", "want", "like", "into", "over", "under", "through", "about", "your", "their",
]);

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractQueryTerms = (value: string) => {
  const normalized = normalizeText(value);
  return Array.from(new Set(
    normalized
      .split(" ")
      .map((w) => w.trim())
      .filter((w) => w.length >= 2 && !STOP_WORDS.has(w))
  )).slice(0, 10);
};

const hasTermEvidence = (text: string, terms: string[]) => {
  if (terms.length === 0) return true;
  const normalizedText = normalizeText(text);
  // At least one query term must appear as a substring in the profile text
  return terms.some((term) => normalizedText.includes(term.toLowerCase()));
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const publishableKey =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
    if (!publishableKey) {
      return new Response(JSON.stringify({ error: "Backend publishable key is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      publishableKey,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims)
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const userId = claimsData.claims.sub as string;
    const { query, followUpAnswer, step } = await req.json();

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Backend service role key is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      serviceRoleKey
    );

    // Step 1: Generate follow-up question
    if (step === "follow-up") {
      const followUpRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a smart networking AI. The user described who they're looking for. Generate ONE short, specific follow-up question to refine the search. Return ONLY the question text, nothing else.`,
            },
            { role: "user", content: `Search query: "${query}"` },
          ],
          max_tokens: 100,
          temperature: 0.7,
        }),
      });

      if (!followUpRes.ok) {
        const errText = await followUpRes.text();
        console.error("Groq follow-up error:", followUpRes.status, errText);
        return new Response(
          JSON.stringify({ followUp: "Are you looking for someone who can commit full-time, or would part-time work too?" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const followUpData = await followUpRes.json();
      const followUp = followUpData.choices?.[0]?.message?.content?.trim() || 
        "What's most important to you in this collaboration?";

      return new Response(JSON.stringify({ followUp }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Search and score matches
    const fullQuery = `${query}. Additional context: ${followUpAnswer || ""}`;

    // Get query embedding
    const embRes = await fetch("https://api.groq.com/openai/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama3-embed-8b", input: fullQuery }),
    });

    let candidateIds: string[] = [];

    if (embRes.ok) {
      const embData = await embRes.json();
      const queryVec = embData.data?.[0]?.embedding;
      if (queryVec) {
        const vecStr = `[${queryVec.join(",")}]`;
        const { data: matchData } = await supabase.rpc("match_profiles", {
          query_embedding: vecStr,
          match_threshold: 0.3,
          match_count: 10,
          exclude_user_id: userId,
        });
        candidateIds = (matchData || []).map((m: any) => m.user_id);
      }
    }

    // If no vector matches (cold start), fall back to all profiles
    if (candidateIds.length === 0) {
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .neq("user_id", userId)
        .eq("visibility", "public")
        .limit(50);
      candidateIds = (allProfiles || []).map((p: any) => p.user_id);
    }

    if (candidateIds.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch candidate data
    const { data: candidates } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", candidateIds);

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get searcher data for context
    const { data: searcherProfile } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    const { data: searcherIdentity } = await supabase.from("user_identity").select("*").eq("user_id", userId).single();
    const { data: searcherPersonality } = await supabase.from("personality").select("*").eq("user_id", userId).single();

    // Fetch candidate identities and personalities
    const { data: candidateIdentities } = await supabase.from("user_identity").select("*").in("user_id", candidateIds);
    const { data: candidatePersonalities } = await supabase.from("personality").select("*").in("user_id", candidateIds);
    const { data: candidateIkigais } = await supabase.from("ikigai").select("*").in("user_id", candidateIds);

    const candidateMap = new Map();
    candidates.forEach(c => {
      candidateMap.set(c.user_id, {
        profile: c,
        identity: candidateIdentities?.find(i => i.user_id === c.user_id),
        personality: candidatePersonalities?.find(p => p.user_id === c.user_id),
        ikigai: candidateIkigais?.find(ik => ik.user_id === c.user_id),
      });
    });

    // Helper to build a personality summary from all fields
    const buildPersonalitySummary = (p: any) => {
      if (!p) return "";
      const fields = [
        ["Working style", p.working_style, p.working_style_detail],
        ["Communication style", p.communication_style],
        ["Communication depth", p.communication_depth],
        ["Communication rhythm", p.communication_rhythm],
        ["Stress response", p.stress_response],
        ["Conflict style", p.conflict_style, p.conflict_detail],
        ["Trust style", p.trust_style, p.trust_style_detail],
        ["Feedback style", p.feedback_style, p.feedback_style_detail],
        ["Vision flexibility", p.vision_flexibility, p.vision_flexibility_detail],
        ["Mission priority", p.mission_priority, p.mission_priority_detail],
        ["Commitment type", p.commitment_type],
        ["Commitment consistency", p.commitment_consistency],
        ["Motivation style", p.motivation_style],
        ["Recognition style", p.recognition_style],
        ["Adaptability", p.adaptability],
        ["Work-life balance", p.work_life_balance],
        ["Decision speed", p.decision_speed],
        ["Decision structure", p.decision_structure],
        ["Autonomy level", p.autonomy_level],
        ["Assertiveness", p.assertiveness],
        ["Ownership style", p.ownership_style],
        ["Ideal environment", p.ideal_environment],
        ["Non-negotiables", p.non_negotiables],
        ["Dealbreakers", p.dealbreakers],
        ["Long-term vision", p.long_term_vision],
      ];
      return fields
        .filter(([, val]) => val)
        .map(([label, val, detail]) => detail ? `${label}: ${val} — ${detail}` : `${label}: ${val}`)
        .join(". ");
    };

    // Build candidate summaries and apply strict evidence pre-filter
    const candidatePool = candidates.map(c => {
      const cd = candidateMap.get(c.user_id);
      const parts = [`Name: ${c.name || "Unknown"}`];
      if (c.domain) parts.push(`Domain: ${c.domain}`);
      if (c.industries?.length) parts.push(`Industries: ${c.industries.join(", ")}`);
      if (c.core_skills?.length) parts.push(`Skills: ${c.core_skills.join(", ")}`);
      if (c.location_country) parts.push(`Location: ${c.location_city || ""} ${c.location_country}`);
      if (cd?.identity) parts.push(`Role: ${cd.identity.identity_type}, Intent: ${(cd.identity.intent_types || []).join(", ")}`);
      if (cd?.ikigai) {
        if (cd.ikigai.love_text) parts.push(`Loves: ${cd.ikigai.love_text}`);
        if (cd.ikigai.good_at_text) parts.push(`Good at: ${cd.ikigai.good_at_text}`);
      }
      const personalitySummary = buildPersonalitySummary(cd?.personality);
      if (personalitySummary) parts.push(`Personality: ${personalitySummary}`);

      const roleLabel = c.domain || cd?.identity?.identity_type || "Professional";
      return {
        userId: c.user_id,
        profile: c,
        roleLabel,
        summary: parts.join(". "),
      };
    });

    const queryTerms = extractQueryTerms(query || "");
    const filteredPool = queryTerms.length > 0
      ? candidatePool.filter((c) => hasTermEvidence(c.summary, queryTerms))
      : candidatePool;

    if (filteredPool.length === 0) {
      return new Response(JSON.stringify({
        matches: [],
        noMatchReason: `No exact role/skill match found for "${query}". Try broader terms or synonyms.`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searcherPersonalitySummary = buildPersonalitySummary(searcherPersonality);

    const scoringPrompt = `You are a strict professional matching AI that evaluates both skill fit AND personality alignment.

SEARCHER:
Name: ${searcherProfile?.name || "Unknown"}
Query: "${fullQuery}"
Identity: ${searcherIdentity?.identity_type || "unknown"}, Intent: ${(searcherIdentity?.intent_types || []).join(", ")}
${searcherPersonalitySummary ? `Personality: ${searcherPersonalitySummary}` : "No personality data available."}

QUERY TERMS THAT MUST HAVE EVIDENCE: ${queryTerms.join(", ") || "(none)"}

CANDIDATES:
${filteredPool.map((c, i) => `[${i}] ${c.summary}`).join("\n")}

SCORING RULES:
1. COMPATIBILITY (0-100): Primarily based on skills, domain, industry, and role fit relative to the query. This is the primary score.
2. SUSTAINABILITY (0-100): Based on personality alignment — compare working styles, communication preferences, conflict resolution, trust styles, vision flexibility, commitment consistency, and motivation between searcher and candidate. Similar or complementary styles score higher; clashing styles (e.g., "avoid conflict" vs "direct confrontation") score lower.
3. When two candidates have similar skill fit, use personality alignment as the tiebreaker for ranking.
4. Return ONLY candidates with clear evidence from their profile summary for the query.
5. Do NOT infer missing skills or roles.
6. If no candidate clearly matches, return an empty array.
7. Compatibility must be <= 40 when evidence is weak.
8. In the summary, mention both skill relevance AND any notable personality alignment or friction.
9. In risks, flag personality clashes (e.g., mismatched communication styles, conflicting work-life priorities).

Return a JSON array where each item has:
- index (number)
- compatibility (0-100)
- sustainability (0-100)
- summary (2-3 sentences: skill fit + personality alignment notes)
- strengths (2-3 strings, can include personality strengths like "complementary communication styles")
- risks (1-2 items: {type, severity: "Low"|"Medium"|"High", explanation} — include personality-based risks)
- starters (2-3 strings)

Return ONLY valid JSON array.`;

    const scoringRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: scoringPrompt }],
        max_tokens: 3000,
        temperature: 0.2,
      }),
    });

    if (!scoringRes.ok) {
      const errText = await scoringRes.text();
      console.error("Groq scoring error:", scoringRes.status, errText);
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scoringData = await scoringRes.json();
    let matchScores: any[] = [];
    try {
      const rawContent = scoringData.choices?.[0]?.message?.content || "[]";
      const content = rawContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();
      const parsed = JSON.parse(content);
      matchScores = Array.isArray(parsed) ? parsed : parsed.matches || [];
    } catch {
      matchScores = [];
    }

    const matches = matchScores
      .filter((m: any) => typeof m.index === "number" && m.index >= 0 && m.index < filteredPool.length)
      .map((m: any) => {
        const candidateItem = filteredPool[m.index];
        const candidate = candidateItem?.profile;

        return {
          name: candidate?.name || "Unknown",
          role: candidateItem?.roleLabel || "Professional",
          location: [candidate?.location_city, candidate?.location_country].filter(Boolean).join(", ") || "Unknown",
          compatibility: Math.min(100, Math.max(0, Number(m.compatibility) || 0)),
          sustainability: Math.min(100, Math.max(0, Number(m.sustainability) || 0)),
          summary: m.summary || `${candidate?.name} may be a potential match.`,
          strengths: Array.isArray(m.strengths) ? m.strengths : [],
          risks: (Array.isArray(m.risks) ? m.risks : []).map((r: any) => ({
            type: r.type || "Unknown",
            severity: ["Low", "Medium", "High"].includes(r.severity) ? r.severity : "Low",
            explanation: r.explanation || "",
          })),
          starters: Array.isArray(m.starters) && m.starters.length > 0 ? m.starters : ["Tell me about your work."],
          user_id: candidate?.user_id,
        };
      })
      .filter((m: any) => m.compatibility >= 45)
      .sort((a: any, b: any) => b.compatibility - a.compatibility);

    // Cache matches in DB
    for (const match of matches) {
      if (match.user_id) {
        try {
          await supabase.from("matches").insert({
            user_a_id: userId,
            user_b_id: match.user_id,
            compatibility_score: match.compatibility / 100,
            sustainability_score: match.sustainability / 100,
            role_category: match.role,
            strengths: match.strengths,
            risk_flags: match.risks,
            conversation_starters: match.starters,
            summary: match.summary,
          });
        } catch {
          // Ignore duplicates
        }
      }
    }

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
