ALTER TABLE public.personality
  ADD COLUMN IF NOT EXISTS step_back_reason text,
  ADD COLUMN IF NOT EXISTS working_style_detail text,
  ADD COLUMN IF NOT EXISTS vision_flexibility_detail text,
  ADD COLUMN IF NOT EXISTS trust_style_detail text;