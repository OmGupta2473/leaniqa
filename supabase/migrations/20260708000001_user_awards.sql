CREATE TABLE IF NOT EXISTS public.user_streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    highest_streak INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    award_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, award_id)
);

-- RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own streaks" ON public.user_streaks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own awards" ON public.user_awards FOR ALL USING (auth.uid() = user_id);
