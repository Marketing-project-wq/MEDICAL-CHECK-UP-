-- 006_create_rls_policies.sql
-- Enable Row Level Security and create policies

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- MCU_UPLOADS
-- ============================================================
ALTER TABLE mcu_uploads ENABLE ROW LEVEL SECURITY;

-- Users can view their own uploads
CREATE POLICY "Users can view own uploads"
  ON mcu_uploads FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone (including anonymous / pre-claim) can insert uploads
CREATE POLICY "Anyone can insert uploads"
  ON mcu_uploads FOR INSERT
  WITH CHECK (true);

-- Users can update their own uploads (e.g. claiming)
CREATE POLICY "Users can update own uploads"
  ON mcu_uploads FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- MCU_RESULTS
-- ============================================================
ALTER TABLE mcu_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own results
CREATE POLICY "Users can view own results"
  ON mcu_results FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- ARTICLES
-- ============================================================
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Public (anyone) can read non-premium articles
CREATE POLICY "Public can view non-premium articles"
  ON articles FOR SELECT
  USING (is_premium = false);

-- Authenticated users can read all articles (including premium)
CREATE POLICY "Authenticated users can view all articles"
  ON articles FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- QUIZZES (public read)
-- ============================================================
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Anyone can view active quizzes
CREATE POLICY "Anyone can view active quizzes"
  ON quizzes FOR SELECT
  USING (is_active = true);

-- ============================================================
-- QUIZ_QUESTIONS (public read)
-- ============================================================
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Anyone can view quiz questions
CREATE POLICY "Anyone can view quiz questions"
  ON quiz_questions FOR SELECT
  USING (true);

-- ============================================================
-- QUIZ_RESPONSES
-- ============================================================
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

-- Users can view their own responses
CREATE POLICY "Users can view own quiz responses"
  ON quiz_responses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "Users can insert own quiz responses"
  ON quiz_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
