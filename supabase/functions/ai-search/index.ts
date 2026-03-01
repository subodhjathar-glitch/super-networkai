import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
        .limit(10);
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

    // Use Groq LLM to score and generate match reports
    const candidateSummaries = candidates.map(c => {
      const cd = candidateMap.get(c.user_id);
      const parts = [`Name: ${c.name || "Unknown"}`];
      if (c.industries?.length) parts.push(`Industries: ${c.industries.join(", ")}`);
      if (c.core_skills?.length) parts.push(`Skills: ${c.core_skills.join(", ")}`);
      if (c.location_country) parts.push(`Location: ${c.location_city || ""} ${c.location_country}`);
      if (cd?.identity) parts.push(`Role: ${cd.identity.identity_type}, Intent: ${(cd.identity.intent_types || []).join(", ")}`);
      if (cd?.ikigai) {
        if (cd.ikigai.love_text) parts.push(`Loves: ${cd.ikigai.love_text}`);
        if (cd.ikigai.good_at_text) parts.push(`Good at: ${cd.ikigai.good_at_text}`);
      }
      if (cd?.personality) {
        const relevant = ["working_style", "stress_response", "communication_style", "commitment_type"];
        relevant.forEach(k => {
          if (cd.personality[k]) parts.push(`${k}: ${cd.personality[k]}`);
        });
      }
      return { userId: c.user_id, summary: parts.join(". ") };
    });

    const scoringPrompt = `You are a professional networking AI that scores matches.

SEARCHER:
Name: ${searcherProfile?.name || "Unknown"}
Query: "${fullQuery}"
Identity: ${searcherIdentity?.identity_type || "unknown"}, Intent: ${(searcherIdentity?.intent_types || []).join(", ")}
${searcherPersonality ? `Working style: ${searcherPersonality.working_style || "unknown"}, Communication: ${searcherPersonality.communication_style || "unknown"}` : ""}

CANDIDATES:
${candidateSummaries.map((c, i) => `[${i}] ${c.summary}`).join("\n")}

For each candidate, return a JSON array of match objects. Each match must have:
- index (number): candidate index
- compatibility (number 0-100): how well they match the search query and searcher profile
- sustainability (number 0-100): long-term partnership health
- summary (string): 1-2 sentence insight about this match
- strengths (string[]): 2-3 key strengths
- risks (array of {type: string, severity: "Low"|"Medium"|"High", explanation: string}): 1-2 risk flags
- starters (string[]): 2-3 conversation starters

Return ONLY valid JSON array, no other text.`;

    const scoringRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: scoringPrompt }],
        max_tokens: 4000,
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    });

    if (!scoringRes.ok) {
      const errText = await scoringRes.text();
      console.error("Groq scoring error:", scoringRes.status, errText);
      // Return basic matches without AI scoring
      const basicMatches = candidates.map(c => ({
        name: c.name || "Unknown",
        role: candidateMap.get(c.user_id)?.identity?.identity_type || "Professional",
        location: [c.location_city, c.location_country].filter(Boolean).join(", ") || "Unknown",
        compatibility: 70,
        sustainability: 65,
        summary: `${c.name} has relevant skills and experience.`,
        strengths: c.core_skills?.slice(0, 3) || ["Professional"],
        risks: [],
        starters: ["Tell me about your current projects.", "What drives your work?"],
        userId: c.user_id,
      }));
      return new Response(JSON.stringify({ matches: basicMatches }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scoringData = await scoringRes.json();
    let matchScores: any[];
    try {
      const content = scoringData.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      matchScores = Array.isArray(parsed) ? parsed : parsed.matches || parsed.results || Object.values(parsed)[0] || [];
    } catch {
      matchScores = [];
    }

    const matches = matchScores
      .filter((m: any) => typeof m.index === "number" && m.index < candidateSummaries.length)
      .map((m: any) => {
        const candidate = candidates[m.index];
        const cd = candidateMap.get(candidate?.user_id);
        return {
          name: candidate?.name || "Unknown",
          role: cd?.identity
            ? `${cd.identity.identity_type}${cd.identity.intent_types?.length ? " · " + cd.identity.intent_types[0] : ""}`
            : "Professional",
          location: [candidate?.location_city, candidate?.location_country].filter(Boolean).join(", ") || "Unknown",
          compatibility: Math.min(100, Math.max(0, m.compatibility || 70)),
          sustainability: Math.min(100, Math.max(0, m.sustainability || 65)),
          summary: m.summary || `${candidate?.name} is a potential match.`,
          strengths: m.strengths || [],
          risks: (m.risks || []).map((r: any) => ({
            type: r.type || "Unknown",
            severity: ["Low", "Medium", "High"].includes(r.severity) ? r.severity : "Low",
            explanation: r.explanation || "",
          })),
          starters: m.starters || ["Tell me about your work."],
          userId: candidate?.user_id,
        };
      })
      .sort((a: any, b: any) => b.compatibility - a.compatibility);

    // Cache matches in DB
    for (const match of matches) {
      if (match.userId) {
        await supabase.from("matches").insert({
          user_a_id: userId,
          user_b_id: match.userId,
          compatibility_score: match.compatibility / 100,
          sustainability_score: match.sustainability / 100,
          role_category: match.role,
          strengths: match.strengths,
          risk_flags: match.risks,
          conversation_starters: match.starters,
          summary: match.summary,
        }).catch(() => {}); // Ignore duplicates
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
