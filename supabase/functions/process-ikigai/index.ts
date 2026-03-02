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
      return new Response(JSON.stringify({ error: "Backend key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    const { ikigai } = await req.json();

    if (!ikigai || !ikigai.love || !ikigai.good || !ikigai.world || !ikigai.livelihood) {
      return new Response(JSON.stringify({ summary: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      return new Response(JSON.stringify({ summary: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a warm, insightful career and purpose coach. Based on the following Ikigai answers, write a 2-3 sentence interpretation that weaves all four dimensions together into a coherent personal purpose statement. Be specific to what they shared — do not use generic phrases. Speak directly to them in second person ("you").

What they love: "${ikigai.love}"
What they're good at: "${ikigai.good}"  
What the world needs: "${ikigai.world}"
What they can be paid for: "${ikigai.livelihood}"

Return ONLY the interpretation text, no JSON, no quotes, no preamble.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      console.error("Groq ikigai error:", await res.text());
      return new Response(JSON.stringify({ summary: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const summary = data.choices?.[0]?.message?.content?.trim() || null;

    // Save summary to ikigai table
    if (summary) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      await supabase.from("ikigai").update({ ai_summary: summary }).eq("user_id", userId);
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("process-ikigai error:", e);
    return new Response(JSON.stringify({ summary: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
