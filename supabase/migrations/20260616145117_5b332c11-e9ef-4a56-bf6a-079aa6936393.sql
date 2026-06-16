
CREATE TABLE public.healix_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  session_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_healix_conv_user_id ON public.healix_conversations(user_id);
CREATE INDEX idx_healix_conv_session_id ON public.healix_conversations(session_id);
CREATE INDEX idx_healix_conv_created_at ON public.healix_conversations(created_at DESC);

GRANT SELECT ON public.healix_conversations TO authenticated;
GRANT ALL ON public.healix_conversations TO service_role;

ALTER TABLE public.healix_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own conversations"
  ON public.healix_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
