-- ==============================================================================
-- LifeSync Database Schema (PostgreSQL for Supabase)
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT '',
    birth_year SMALLINT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 2. Food Logs Table
CREATE TABLE IF NOT EXISTS public.food_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name TEXT NOT NULL,
    portion_description TEXT,
    calories_estimate NUMERIC(7, 2),
    protein_g NUMERIC(6, 2),
    carbs_g NUMERIC(6, 2),
    fat_g NUMERIC(6, 2),
    image_path TEXT,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ai_assisted')),
    user_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own food logs"
    ON public.food_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food logs"
    ON public.food_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food logs"
    ON public.food_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food logs"
    ON public.food_logs FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Water Logs Table
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own water logs"
    ON public.water_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water logs"
    ON public.water_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own water logs"
    ON public.water_logs FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Sleep Logs Table
CREATE TABLE IF NOT EXISTS public.sleep_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bedtime TIMESTAMPTZ NOT NULL,
    wake_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_sleep_interval CHECK (wake_time > bedtime)
);

ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sleep logs"
    ON public.sleep_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sleep logs"
    ON public.sleep_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sleep logs"
    ON public.sleep_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sleep logs"
    ON public.sleep_logs FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Quests Table (Global quest definitions)
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('nutrition', 'hydration', 'sleep', 'general')),
    points INTEGER NOT NULL DEFAULT 10,
    rule_key TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active quests"
    ON public.quests FOR SELECT
    USING (active = TRUE);

-- 6. User Quests Table (Daily quest tracking per user)
CREATE TABLE IF NOT EXISTS public.user_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
    quest_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'completed')),
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_user_quest_date UNIQUE (user_id, quest_id, quest_date)
);

ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quests"
    ON public.user_quests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own quests"
    ON public.user_quests FOR UPDATE
    USING (auth.uid() = user_id);

-- 7. Point Transactions Table (Ledger for all awards)
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    points_delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reference_id UUID,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points transactions"
    ON public.point_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- 8. Notification Settings Table (LINE & Preferences)
CREATE TABLE IF NOT EXISTS public.notification_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    line_user_id TEXT,
    line_linked_at TIMESTAMPTZ,
    hydration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sleep_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    daily_summary_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_preferences JSONB NOT NULL DEFAULT '{"hydration_interval_hours": 2, "quiet_hours_start": "22:00", "quiet_hours_end": "07:00"}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification settings"
    ON public.notification_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
    ON public.notification_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
    ON public.notification_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Seed basic initial quests
INSERT INTO public.quests (title, description, category, points, rule_key, active)
VALUES 
    ('Hydrate Your Day', 'Log your water intake at least once today', 'hydration', 10, 'log_water_once', true),
    ('Balanced Fuel', 'Record at least one meal today', 'nutrition', 10, 'log_meal_once', true),
    ('Rest Well', 'Record your sleep schedule for last night', 'sleep', 15, 'log_sleep_once', true),
    ('Weekly Review', 'Check your habit progress dashboard', 'general', 5, 'view_dashboard', true)
ON CONFLICT (rule_key) DO NOTHING;
