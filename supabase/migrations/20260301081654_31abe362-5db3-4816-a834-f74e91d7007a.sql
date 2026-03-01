
-- =============================================
-- SuperNetworkAI Database Schema (PRD v3.0)
-- =============================================

-- 1. Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  photo_url TEXT,
  location_country TEXT,
  location_city TEXT,
  industries TEXT[] DEFAULT '{}',
  industry_other TEXT,
  core_skills TEXT[] DEFAULT '{}',
  domain TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  cv_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all public profiles" ON public.profiles
  FOR SELECT USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- 2. User Identity table
CREATE TABLE public.user_identity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  identity_type TEXT NOT NULL,
  intent_types TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_identity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own identity" ON public.user_identity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own identity" ON public.user_identity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own identity" ON public.user_identity
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Ikigai table
CREATE TABLE public.ikigai (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  love_text TEXT,
  good_at_text TEXT,
  world_needs_text TEXT,
  livelihood_text TEXT,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ikigai ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ikigai" ON public.ikigai
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ikigai" ON public.ikigai
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ikigai" ON public.ikigai
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Personality table (assessment answers)
CREATE TABLE public.personality (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- Universal
  working_style TEXT,
  working_style_other TEXT,
  stress_response TEXT,
  stress_response_other TEXT,
  recognition_style TEXT,
  recognition_style_other TEXT,
  mission_priority TEXT,
  mission_priority_detail TEXT,
  communication_style TEXT,
  -- Co-founder track
  vision_flexibility TEXT,
  vision_flexibility_other TEXT,
  equity_expectations TEXT,
  equity_expectations_other TEXT,
  decision_structure TEXT,
  financial_runway TEXT,
  long_term_vision TEXT,
  past_collaboration TEXT,
  commitment_consistency TEXT,
  commitment_consistency_other TEXT,
  trust_style TEXT,
  trust_style_other TEXT,
  communication_depth TEXT,
  work_life_balance TEXT,
  work_life_balance_other TEXT,
  non_negotiables TEXT,
  -- Teammate track
  ownership_style TEXT,
  feedback_style TEXT,
  feedback_style_other TEXT,
  feedback_style_detail TEXT,
  leadership_pref TEXT[],
  autonomy_level TEXT,
  adaptability TEXT,
  adaptability_other TEXT,
  motivation_style TEXT,
  motivation_style_other TEXT,
  conflict_style TEXT,
  conflict_detail TEXT,
  commitment_type TEXT,
  ideal_environment TEXT,
  startup_readiness TEXT,
  dealbreakers TEXT,
  assertiveness TEXT,
  assertiveness_other TEXT,
  -- Client track
  involvement_pref TEXT,
  communication_rhythm TEXT,
  relationship_style TEXT,
  decision_speed TEXT,
  scope_clarity TEXT,
  budget_philosophy TEXT[],
  past_collab_exp TEXT,
  timeline_style TEXT,
  success_criteria TEXT,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.personality ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own personality" ON public.personality
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personality" ON public.personality
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personality" ON public.personality
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Embeddings table (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  vector vector(768),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view embeddings for search" ON public.embeddings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own embedding" ON public.embeddings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own embedding" ON public.embeddings
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Matches table (cached match reports)
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a_id UUID NOT NULL,
  user_b_id UUID NOT NULL,
  compatibility_score REAL,
  sustainability_score REAL,
  role_category TEXT,
  strengths TEXT[] DEFAULT '{}',
  risk_flags JSONB DEFAULT '[]',
  conversation_starters TEXT[] DEFAULT '{}',
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches" ON public.matches
  FOR SELECT USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

CREATE POLICY "Authenticated can insert matches" ON public.matches
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_a_id);

-- 7. Connections table
CREATE TABLE public.connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections" ON public.connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create connection requests" ON public.connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Recipients can update connection status" ON public.connections
  FOR UPDATE USING (auth.uid() = recipient_id);

-- 8. Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their connections" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = connection_id
      AND (c.requester_id = auth.uid() OR c.recipient_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their connections" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.connections c
      WHERE c.id = connection_id
      AND c.status = 'accepted'
      AND (c.requester_id = auth.uid() OR c.recipient_id = auth.uid())
    )
  );

-- 9. Blocks table
CREATE TABLE public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks" ON public.blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks" ON public.blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can remove blocks" ON public.blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- 10. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_identity_updated_at BEFORE UPDATE ON public.user_identity FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ikigai_updated_at BEFORE UPDATE ON public.ikigai FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_personality_updated_at BEFORE UPDATE ON public.personality FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_embeddings_updated_at BEFORE UPDATE ON public.embeddings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. CV storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('cvs', 'cvs', false);

CREATE POLICY "Users can upload own CV" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own CV" ON storage.objects
  FOR SELECT USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own CV" ON storage.objects
  FOR UPDATE USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);
