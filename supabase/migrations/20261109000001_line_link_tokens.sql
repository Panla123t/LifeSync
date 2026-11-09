-- Migration: Add line_link_tokens table for secure LINE OA account linking
CREATE TABLE IF NOT EXISTS public.line_link_tokens (
    token TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.line_link_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own link tokens"
    ON public.line_link_tokens FOR ALL
    USING (auth.uid() = user_id);
