-- 004_create_articles.sql
-- Create articles table for health-related content

CREATE TABLE articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  category TEXT NOT NULL,
  tags TEXT[],
  is_premium BOOLEAN DEFAULT false,
  read_time_minutes INT DEFAULT 5,
  author TEXT DEFAULT '20fit Team',
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for slug lookup
CREATE INDEX idx_articles_slug ON articles(slug);

-- Index for category filtering
CREATE INDEX idx_articles_category ON articles(category);

-- Index for published_at ordering
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
