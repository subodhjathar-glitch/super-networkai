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

    // Fetch user context for tailored follow-ups
    const { data: searcherIdentity } = await supabase.from("user_identity").select("*").eq("user_id", userId).single();

    // Step 1: Generate follow-up question (Prompt 4 from PRD)
    if (step === "follow-up") {
      const followUpRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are a strict structured data processor. Use ONLY the information provided. Do not infer, assume, or invent data.
              
              Task: Parse the user's search query into a structured intent object and determine if required fields are missing.
              
              User Role: ${searcherIdentity?.identity_type || "Unknown"}
              User Intent: ${(searcherIdentity?.intent_types || []).join(", ")}
              
              Required fields per role sought:
              - Co-founder: role_seeking, industry, commitment_type, skills_needed
              - Teammate: role_seeking, skills_needed, commitment_type
              - Client: role_seeking, industry, project_type
              
              If fields are missing, generate ONE targeted, conversational follow-up question to capture the most critical missing piece.
              
              Return JSON:
              {
                "parsed_intent": { "role_seeking": string, "skills_needed": string[], "industry": string, "commitment_type": string },
                "missing_fields": string[],
                "followUp": string | null
              }`,
            },
            { role: "user", content: `Query: "${query}"` },
          ],
          max_tokens: 300,
          temperature: 0.1,
          response_format: { type: "json_object" }
        }),
      });

      if (!followUpRes.ok) {
        // Fallback if AI fails
        return new Response(JSON.stringify({ followUp: "What's most important to you in this collaboration?" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const followUpData = await followUpRes.json();
      const parsed = JSON.parse(followUpData.choices?.[0]?.message?.content || "{}");
      
      return new Response(JSON.stringify({ followUp: parsed.followUp || null }), {
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

    // Block filtering (PRD Req 9)
    const { data: blocks } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", userId);
    const blockedIds = (blocks || []).map((b: any) => b.blocked_id);

    if (embRes.ok) {
      const embData = await embRes.json();
      const queryVec = embData.data?.[0]?.embedding;
      if (queryVec) {
        const vecStr = `[${queryVec.join(",")}]`;
        const { data: matchData } = await supabase.rpc("match_profiles", {
          query_embedding: vecStr,
          match_threshold: 0.3,
          match_count: 20, // Increased to allow for filtering
          exclude_user_id: userId,
        });
        candidateIds = (matchData || []).map((m: any) => m.user_id);
      }
    }

    // Filter out blocked users
    candidateIds = candidateIds.filter(id => !blockedIds.includes(id));

    // Fallback to recent profiles if no vector matches
    if (candidateIds.length === 0) {
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .neq("user_id", userId)
        .not("user_id", "in", `(${blockedIds.join(",") || "00000000-0000-0000-0000-000000000000"})`) 
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
    const { data: candidates } = await supabase.from("profiles").select("*").in("user_id", candidateIds);
    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get searcher data
    const { data: searcherProfile } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    const { data: searcherPersonality } = await supabase.from("personality").select("*").eq("user_id", userId).single();
    const { data: searcherIkigai } = await supabase.from("ikigai").select("*").eq("user_id", userId).single();

    // Fetch candidate details
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

    // ── PRD Requirement 1: Identity + Intent Pre-filter ──
    const searcherIntents: string[] = searcherIdentity?.intent_types || [];
    const searcherWantsAll = searcherIntents.includes("all");
    const searcherIsFounder = searcherIdentity?.identity_type === "founder";
    const searcherSeekingCofounder = searcherIntents.includes("cofounder");

    const filteredCandidates = candidates.filter(c => {
      const cIdentity = candidateIdentities?.find(i => i.user_id === c.user_id);
      if (!cIdentity) return false;

      // Rule: Founder seeking Co-founder matches ONLY Founder seeking Co-founder (bidirectional)
      if (searcherIsFounder && searcherSeekingCofounder) {
        const isFounder = cIdentity.identity_type === "founder";
        const seeksCofounder = (cIdentity.intent_types || []).includes("cofounder");
        // PRD strict rule: "Only Founders who also seek a co-founder"
        // But we allow if they seek "all" too
        const seeksAll = (cIdentity.intent_types || []).includes("all");
        if (isFounder && (seeksCofounder || seeksAll)) return true;
        
        // If searching strictly for co-founder, filter out non-founders
        if (!searcherWantsAll) return false; 
      }

      // Standard intent overlap check
      if (searcherWantsAll) return true;
      const cIntents: string[] = cIdentity.intent_types || [];
      if (cIntents.includes("all")) return true;
      return searcherIntents.some(si => cIntents.includes(si));
    });

    if (filteredCandidates.length === 0) {
      return new Response(JSON.stringify({
        matches: [],
        noMatchReason: `No profiles found matching your intent. Try broadening your search.`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper to build comprehensive JSON for LLM (PRD Req 4)
    const buildFullProfileJSON = (profile: any, identity: any, personality: any, ikigai: any) => ({
      name: profile?.name,
      role: identity?.identity_type,
      intent: identity?.intent_types,
      location: `${profile?.location_city || ""}, ${profile?.location_country || ""}`,
      skills: profile?.core_skills,
      domain: profile?.domain,
      industries: profile?.industries,
      // Compatibility fields
      commitment_type: personality?.commitment_type,
      financial_runway: personality?.financial_runway,
      decision_speed: personality?.decision_speed,
      communication_style: personality?.communication_style,
      long_term_vision: personality?.long_term_vision,
      ikigai_summary: ikigai?.ai_summary,
      // Sustainability fields
      mission_priority: personality?.mission_priority,
      mission_priority_detail: personality?.mission_priority_detail,
      conflict_style: personality?.conflict_style,
      conflict_detail: personality?.conflict_detail,
      recognition_style: personality?.recognition_style,
      recognition_detail: personality?.recognition_style_detail, // Note: DB field name check
      commitment_consistency: personality?.commitment_consistency,
      work_life_balance: personality?.work_life_balance,
      working_style: personality?.working_style,
      working_style_detail: personality?.working_style_detail,
      stress_response: personality?.stress_response,
      trust_style: personality?.trust_style,
      trust_style_detail: personality?.trust_style_detail,
    });

    const searcherJSON = buildFullProfileJSON(searcherProfile, searcherIdentity, searcherPersonality, searcherIkigai);
    const candidatesJSON = filteredCandidates.map(c => {
      const data = candidateMap.get(c.user_id);
      return {
        user_id: c.user_id,
        ...buildFullProfileJSON(data.profile, data.identity, data.personality, data.ikigai)
      };
    });

    const queryTerms = extractQueryTerms(query || "");

    // ── PRD Req 4 & 5: Risk Simulation Prompt ──
    const scoringPrompt = `You are a strict structured data processor. Use ONLY the information provided. Do not infer, assume, or invent any data not explicitly present in the input.

SEARCHER PROFILE:
${JSON.stringify(searcherJSON, null, 2)}

QUERY: "${fullQuery}"
MANDATORY TERMS: ${queryTerms.join(", ") || "(none)"}

CANDIDATES:
${JSON.stringify(candidatesJSON, null, 2)}

SCORING RULES (PRD v3.0):

1. COMPATIBILITY SCORE (0-100) - Today's Fit:
   - Skill Complementarity (30%): Overlap + gap analysis
   - Vision & Mission (25%): Ikigai summary + long_term_vision
   - Industry Alignment (20%): Industries match
   - Commitment Compatibility (15%): commitment_type + financial_runway
   - Working Style Fit (10%): decision_speed + communication_style

2. SUSTAINABILITY SCORE (0-100) - Long-term Health:
   - Mission Priority (35%): Compare mission_priority (brand_first/self_first/balanced)
   - Conflict Style (25%): Compare conflict_style + detail
   - Recognition Style (20%): Compare recognition_style + detail
   - Commitment Consistency (20%): commitment_consistency + work_life_balance

3. RULES:
   - Return ONLY candidates with clear evidence for the query.
   - Compatibility must be <= 40 if evidence is weak.
   - If skill fit is similar, use Sustainability as tiebreaker.
   - Language: No "ego", "dominant", "controlling". Use "worth discussing", "may benefit from aligning on", "consider exploring".
   - Risk Severity: "Low", "Medium", "High" only.

OUTPUT FORMAT (JSON Array):
[
  {
    "user_id": "uuid",
    "compatibility": number,
    "sustainability": number,
    "summary": "2 sentences blending skill fit + personality note",
    "strengths": ["string", "string", "string"],
    "risks": [{"type": "string", "severity": "Low|Medium|High", "explanation": "string"}],
    "starters": ["string", "string", "string"], // Based on identified risks or shared interests
    "personality_alignment": [ // New field for UI
       {"dimension": "Communication", "match": "good|neutral|friction", "detail": "Both prefer async"},
       {"dimension": "Conflict", "match": "good|neutral|friction", "detail": "Direct vs Avoidant"},
       {"dimension": "Work-Life", "match": "good|neutral|friction", "detail": "Aligned on balance"}
    ]
  }
]`;

    const scoringRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: scoringPrompt }],
        max_tokens: 4000,
        temperature: 0.1, // PRD Req 6
        response_format: { type: "json_object" }
      }),
    });

    if (!scoringRes.ok) {
      console.error("Groq scoring error:", await scoringRes.text());
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scoringData = await scoringRes.json();
    let matchScores: any[] = [];
    try {
      const content = scoringData.choices?.[0]?.message?.content || "[]";
      // Handle potential wrapping key
      const parsed = JSON.parse(content);
      matchScores = Array.isArray(parsed) ? parsed : (parsed.matches || parsed.candidates || []);
    } catch (e) {
      console.error("JSON parse error:", e);
      // PRD Req 7: Auto-repair could go here, for now return empty to avoid crash
      matchScores = [];
    }

    // Join scores with profile data
    const finalMatches = matchScores
      .map((score: any) => {
        const candidate = candidates.find(c => c.user_id === score.user_id);
        if (!candidate) return null;
        
        return {
          ...score,
          name: candidate.name || "Unknown",
          role: candidateMap.get(candidate.user_id)?.identity?.identity_type || "Professional",
          location: [candidate.location_city, candidate.location_country].filter(Boolean).join(", "),
          // Normalize scores
          compatibility: Math.min(100, Math.max(0, Number(score.compatibility) || 0)),
          sustainability: Math.min(100, Math.max(0, Number(score.sustainability) || 0)),
        };
      })
      .filter(Boolean)
      .filter((m: any) => m.compatibility >= 40) // PRD Req: Weak evidence filter
      .sort((a: any, b: any) => b.compatibility - a.compatibility);

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
            // Note: We'd need to migrate schema to store personality_alignment if we want to cache it
            // For now, it returns to UI but might be lost on reload if not stored
          });
        } catch {
          // Ignore
        }
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