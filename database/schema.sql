-- Dhaal Supabase Schema

-- Create a table for patients
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    age INTEGER,
    smoking_history TEXT,
    hormonal_contraceptives BOOLEAN,
    hormonal_years NUMERIC,
    iud BOOLEAN,
    iud_years NUMERIC,
    std_history BOOLEAN,
    pregnancies INTEGER
);

-- Create a table for screenings
CREATE TABLE IF NOT EXISTS public.screenings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    clinician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    session_id TEXT UNIQUE NOT NULL,
    clinical_risk_score NUMERIC,
    vision_model_score NUMERIC,
    vision_top_class TEXT,
    ai_triage_priority TEXT,
    hpv_device_connected BOOLEAN DEFAULT false,
    hpv_test_id TEXT,
    hpv_test_quality TEXT,
    hpv_detected BOOLEAN,
    final_human_priority TEXT,
    clinician_notes TEXT,
    report_pdf_url TEXT,
    status TEXT DEFAULT 'pending'
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.screenings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert and read their own records
DROP POLICY IF EXISTS "Allow authenticated users to read patients" ON public.patients;
CREATE POLICY "Allow authenticated users to read patients" ON public.patients FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert patients" ON public.patients;
CREATE POLICY "Allow authenticated users to insert patients" ON public.patients FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to read screenings" ON public.screenings;
CREATE POLICY "Allow authenticated users to read screenings" ON public.screenings FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert screenings" ON public.screenings;
CREATE POLICY "Allow authenticated users to insert screenings" ON public.screenings FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update screenings" ON public.screenings;
CREATE POLICY "Allow authenticated users to update screenings" ON public.screenings FOR UPDATE USING (auth.role() = 'authenticated');
