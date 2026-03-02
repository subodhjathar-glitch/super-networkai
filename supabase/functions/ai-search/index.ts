import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const normalizeText = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
    if (!publishableKey)
      return new Response(JSON.stringify({ error: "Backend key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, publishableKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims)
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const userId = claimsData.claims.sub as string;
    const { step, filterIndustries, filterSkills, prefCountry, prefCity, freeText, query, followUpAnswer } = await req.json();

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey)
      return new Response(JSON.stringify({ error: "Backend service role key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

    // Legacy follow-up step — return null to skip (kept for backward compat)
    if (step === "follow-up") {
      return new Response(JSON.stringify({ followUp: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Fetch searcher context ──
    const { data: searcherIdentity } = await supabase.from("user_identity").select("*").eq("user_id", userId).single();
    const { data: searcherProfile } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    const { data: searcherPersonality } = await supabase.from("personality").select("*").eq("user_id", userId).single();
    const { data: searcherIkigai } = await supabase.from("ikigai").select("*").eq("user_id", userId).single();

    // ── Block filtering ──
    const { data: blocks } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", userId);
    const blockedIds = (blocks || []).map((b: any) => b.blocked_id);

    // ── Step 1: DB-level pre-filtering ──
    const industries: string[] = filterIndustries || [];
    const skills: string[] = filterSkills || [];
    const normalizeLC = (s: string | null) => (s || "").toLowerCase().trim();

    // Start with all public profiles except self and blocked
    let profileQuery = supabase
      .from("profiles")
      .select("*")
      .neq("user_id", userId)
      .eq("visibility", "public");

    if (blockedIds.length > 0) {
      profileQuery = profileQuery.not("user_id", "in", `(${blockedIds.join(",")})`);
    }

    const { data: allCandidates } = await profileQuery.limit(200);

    if (!allCandidates || allCandidates.length === 0) {
      return new Response(JSON.stringify({ matches: [], noMatchReason: "No profiles available yet." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Primary pool: exact filter matches (what the searcher is LOOKING FOR) ──
    let primaryPool = [...allCandidates];

    if (industries.length > 0) {
      const industryNorm = industries.map((i) => normalizeText(i));
      primaryPool = primaryPool.filter((c: any) => {
        const cIndustries = (c.industries || []).map((i: string) => normalizeText(i));
        const cIndustryOther = normalizeText(c.industry_other || "");
        return industryNorm.some(
          (si) => cIndustries.some((ci: string) => ci.includes(si) || si.includes(ci)) || cIndustryOther.includes(si)
        );
      });
    }

    if (skills.length > 0) {
      const skillsNorm = skills.map((s) => normalizeText(s));
      primaryPool = primaryPool.filter((c: any) => {
        const cSkills = (c.core_skills || []).map((s: string) => normalizeText(s));
        return skillsNorm.some((ss) => cSkills.some((cs: string) => cs.includes(ss) || ss.includes(cs)));
      });
    }

    if (prefCountry || prefCity) {
      const pCountry = normalizeLC(prefCountry);
      const pCity = normalizeLC(prefCity);
      const locationFiltered = primaryPool.filter((c: any) => {
        const cCountry = normalizeLC(c.location_country);
        const cCity = normalizeLC(c.location_city);
        if (pCountry && cCountry !== pCountry) return false;
        if (pCity && !cCity.includes(pCity) && !pCity.includes(cCity)) return false;
        return true;
      });
      if (locationFiltered.length > 0) primaryPool = locationFiltered;
    }

    // ── Secondary pool: matches based on searcher's OWN profile (what they ARE) ──
    const primaryIds = new Set(primaryPool.map((c: any) => c.user_id));
    const searcherIndustries = (searcherProfile?.industries || []).map((i: string) => normalizeText(i));
    const searcherSkills = (searcherProfile?.core_skills || []).map((s: string) => normalizeText(s));

    let secondaryPool = allCandidates.filter((c: any) => {
      if (primaryIds.has(c.user_id)) return false; // exclude already in primary
      const cIndustries = (c.industries || []).map((i: string) => normalizeText(i));
      const cSkills = (c.core_skills || []).map((s: string) => normalizeText(s));
      const industryOverlap = searcherIndustries.some((si: string) =>
        cIndustries.some((ci: string) => ci.includes(si) || si.includes(ci))
      );
      const skillOverlap = searcherSkills.some((ss: string) =>
        cSkills.some((cs: string) => cs.includes(ss) || ss.includes(cs))
      );
      return industryOverlap || skillOverlap;
    });

    // Combine both pools for enrichment
    const combinedPool = [...primaryPool, ...secondaryPool];

    if (combinedPool.length === 0) {
      return new Response(JSON.stringify({
        matches: [],
        noMatchReason: "No profiles match your filters or your profile. Try broadening your selection.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Step 2: Intent pre-filter on combined pool ──
    const workingCandidateIds = combinedPool.map((c: any) => c.user_id);
    const { data: candidateIdentities } = await supabase.from("user_identity").select("*").in("user_id", workingCandidateIds);
    const { data: candidatePersonalities } = await supabase.from("personality").select("*").in("user_id", workingCandidateIds);
    const { data: candidateIkigais } = await supabase.from("ikigai").select("*").in("user_id", workingCandidateIds);

    const candidateMap = new Map();
    combinedPool.forEach((c: any) => {
      candidateMap.set(c.user_id, {
        profile: c,
        identity: candidateIdentities?.find((i: any) => i.user_id === c.user_id),
        personality: candidatePersonalities?.find((p: any) => p.user_id === c.user_id),
        ikigai: candidateIkigais?.find((ik: any) => ik.user_id === c.user_id),
      });
    });

    const searcherIntents: string[] = searcherIdentity?.intent_types || [];
    const searcherWantsAll = searcherIntents.includes("all");
    const searcherIsFounder = searcherIdentity?.identity_type === "founder";
    const searcherSeekingCofounder = searcherIntents.includes("cofounder");

    const applyIntentFilter = (pool: any[]) => pool.filter((c: any) => {
      const cIdentity = candidateIdentities?.find((i: any) => i.user_id === c.user_id);
      if (!cIdentity) return false;
      if (searcherIsFounder && searcherSeekingCofounder) {
        const isFounder = cIdentity.identity_type === "founder";
        const seeksCofounder = (cIdentity.intent_types || []).includes("cofounder");
        const seeksAll = (cIdentity.intent_types || []).includes("all");
        if (isFounder && (seeksCofounder || seeksAll)) return true;
        if (!searcherWantsAll) return false;
      }
      if (searcherWantsAll) return true;
      const cIntents: string[] = cIdentity.intent_types || [];
      if (cIntents.includes("all")) return true;
      return searcherIntents.some((si) => cIntents.includes(si));
    });

    const primaryFinal = applyIntentFilter(primaryPool);
    const secondaryFinal = applyIntentFilter(secondaryPool);
    const finalCandidates = [...primaryFinal, ...secondaryFinal];

    if (finalCandidates.length === 0) {
      return new Response(JSON.stringify({
        matches: [],
        noMatchReason: "No profiles match your search criteria or intent. Try broadening your filters.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Tag each candidate with matchType for frontend sectioning
    const primaryFinalIds = new Set(primaryFinal.map((c: any) => c.user_id));


    // ── Step 3: AI Scoring (with deterministic fallback) ──
    const buildCompactProfileJSON = (profile: any, identity: any, personality: any, ikigai: any) => ({
      name: profile?.name,
      role: identity?.identity_type,
      intent: identity?.intent_types,
      location_country: profile?.location_country,
      location_city: profile?.location_city,
      skills: profile?.core_skills,
      industries: profile?.industries,
      ikigai_summary: ikigai?.ai_summary,
      ikigai_love: ikigai?.love_text,
      ikigai_good_at: ikigai?.good_at_text,
      ikigai_world_needs: ikigai?.world_needs_text,
      ikigai_livelihood: ikigai?.livelihood_text,
      working_style: personality?.working_style,
      communication_style: personality?.communication_style,
      conflict_style: personality?.conflict_style,
      trust_style: personality?.trust_style,
      mission_priority: personality?.mission_priority,
      commitment_type: personality?.commitment_type,
      commitment_consistency: personality?.commitment_consistency,
      financial_runway: personality?.financial_runway,
      recognition_style: personality?.recognition_style,
      work_life_balance: personality?.work_life_balance,
      decision_speed: personality?.decision_speed,
      decision_structure: personality?.decision_structure,
    });

    const searcherJSON = buildCompactProfileJSON(searcherProfile, searcherIdentity, searcherPersonality, searcherIkigai);
    const scoredCandidates = finalCandidates.slice(0, 12);
    const candidatesJSON = scoredCandidates.map((c: any) => {
      const data = candidateMap.get(c.user_id);
      return { user_id: c.user_id, ...buildCompactProfileJSON(data.profile, data.identity, data.personality, data.ikigai) };
    });


    const searchContext = [
      industries.length > 0 ? `Industries: ${industries.join(", ")}` : "",
      skills.length > 0 ? `Skills/Roles: ${skills.join(", ")}` : "",
      prefCountry ? `Country: ${prefCountry}` : "",
      prefCity ? `City: ${prefCity}` : "",
      freeText ? `Additional context: ${freeText}` : "",
    ].filter(Boolean).join(". ");

    const scoringPrompt = `You are a strict structured data processor. Use ONLY the information provided. Do not infer, assume, or invent any data not explicitly present in the input.

SEARCHER PROFILE (Person A — the one searching):
${JSON.stringify(searcherJSON, null, 2)}

SEARCH CRITERIA: ${searchContext}
NOTE: Candidates have already been pre-filtered by industry/skills/location. Your job is to SCORE them, not filter them. Score ALL candidates.

CANDIDATES (Person B — potential matches):
${JSON.stringify(candidatesJSON, null, 2)}

SCORING RULES (PRD v3.0 — Strict Weighted Scoring):

1. COMPATIBILITY SCORE (0-100) — Today's Fit:
   - Skill Complementarity (30%): Analyse overlap AND gap-fill between Person A and Person B's core_skills.
   - Vision & Mission Alignment (25%): Compare ikigai_summary, long_term_vision, and love/passion areas.
   - Industry Alignment (20%): Do their industries overlap or naturally complement each other?
   - Commitment Compatibility (15%): Compare commitment_type and financial_runway.
   - Working Style Fit (10%): Compare decision_speed, communication_style, and working_style preferences.

2. SUSTAINABILITY SCORE (0-100) — Long-term Partnership Health:
   - Mission Priority Alignment (35%): Compare mission_priority values.
   - Conflict Style Compatibility (25%): Compare conflict_style + conflict_detail.
   - Recognition Style Match (20%): Compare recognition_style.
   - Commitment Consistency (20%): Compare commitment_consistency + work_life_balance.

3. SUMMARY: Write 4-6 sentences telling a STORY about this potential partnership. Be specific — use actual data from the profiles.

4. PERSONALITY ALIGNMENT: Analyse these dimensions with specific evidence:
   * Communication Style, Conflict Resolution, Work-Life Balance, Decision Making, Trust & Vulnerability, Stress Response, Recognition & Motivation
   For each, explain WHY it's good/neutral/friction.

5. STRENGTHS: 4-6 specific, evidence-based strengths.

6. RISKS: 2-4 specific risks. Severity: "Low", "Medium", "High". NEVER use "ego", "dominant", "controlling".

7. CONVERSATION STARTERS: 4-5 specific, thoughtful conversation starters.

8. RULES:
   - Score ALL candidates provided. They are already pre-filtered.
   - Use the search criteria to weight relevance, but score based on overall profile fit.
   - If a candidate's profile data is sparse, still score them but note the limited data as a risk.

OUTPUT FORMAT (JSON):
{
  "matches": [
    {
      "user_id": "uuid",
      "compatibility": number,
      "sustainability": number,
      "summary": "4-6 sentences",
      "strengths": ["str1", "str2", "str3", "str4"],
      "risks": [{"type": "string", "severity": "Low|Medium|High", "explanation": "string"}],
      "starters": ["q1", "q2", "q3", "q4"],
      "personality_alignment": [
        {"dimension": "Communication Style", "match": "good|neutral|friction", "detail": "string"},
        {"dimension": "Conflict Resolution", "match": "good|neutral|friction", "detail": "string"},
        {"dimension": "Work-Life Balance", "match": "good|neutral|friction", "detail": "string"},
        {"dimension": "Decision Making", "match": "good|neutral|friction", "detail": "string"},
        {"dimension": "Trust & Vulnerability", "match": "good|neutral|friction", "detail": "string"},
        {"dimension": "Stress Response", "match": "good|neutral|friction", "detail": "string"},
        {"dimension": "Recognition & Motivation", "match": "good|neutral|friction", "detail": "string"}
      ]
    }
  ]
}`;

    const scoringRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a strict structured data processor. Return valid JSON only." },
          { role: "user", content: scoringPrompt },
        ],
        max_tokens: 8000,
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!scoringRes.ok) {
      console.error("Groq scoring error:", await scoringRes.text());
      return new Response(JSON.stringify({ matches: [], noMatchReason: "AI scoring temporarily unavailable. Please try again in a moment." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scoringData = await scoringRes.json();
    let matchScores: any[] = [];
    try {
      const content = scoringData.choices?.[0]?.message?.content || "[]";
      const parsed = JSON.parse(content);
      matchScores = Array.isArray(parsed) ? parsed : (parsed.matches || parsed.candidates || []);
    } catch (e) {
      console.error("JSON parse error, attempting repair:", e);
      const rawContent = scoringData.choices?.[0]?.message?.content || "";
      try {
        const repairRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: "Fix the following malformed JSON. Return ONLY valid JSON." },
              { role: "user", content: `Fix this JSON:\n${rawContent}` },
            ],
            max_tokens: 8000,
            temperature: 0.0,
            response_format: { type: "json_object" },
          }),
        });
        if (repairRes.ok) {
          const repairData = await repairRes.json();
          const repairedParsed = JSON.parse(repairData.choices?.[0]?.message?.content || "[]");
          matchScores = Array.isArray(repairedParsed) ? repairedParsed : (repairedParsed.matches || []);
        }
      } catch {
        matchScores = [];
      }
    }

    if (!Array.isArray(matchScores) || matchScores.length === 0) {
      return new Response(JSON.stringify({ matches: [], noMatchReason: "No matches found for your criteria." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Join scores with profile data
    const finalMatches = matchScores
      .map((score: any) => {
        const candidate = finalCandidates.find((c: any) => c.user_id === score.user_id);
        if (!candidate) return null;
        return {
          ...score,
          name: candidate.name || "Unknown",
          role: candidateMap.get(candidate.user_id)?.identity?.identity_type || "Professional",
          location: [candidate.location_city, candidate.location_country].filter(Boolean).join(", "),
          compatibility: Math.min(100, Math.max(0, Number(score.compatibility) || 0)),
          sustainability: Math.min(100, Math.max(0, Number(score.sustainability) || 0)),
          matchType: primaryFinalIds.has(candidate.user_id) ? "primary" : "secondary",
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        // Primary matches first, then secondary; within each group sort by compatibility
        if (a.matchType !== b.matchType) return a.matchType === "primary" ? -1 : 1;
        return b.compatibility - a.compatibility;
      });

    // Cache matches
    for (const match of finalMatches) {
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
        } catch { /* ignore */ }
      }
    }

    return new Response(JSON.stringify({ matches: finalMatches }), {
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
