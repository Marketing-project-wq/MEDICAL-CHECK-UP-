-- 002_create_mcu_uploads.sql
-- Create MCU uploads table for storing uploaded medical check-up files

CREATE TABLE mcu_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  upload_token TEXT UNIQUE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  is_claimed BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  claimed_at TIMESTAMPTZ
);

-- Index for faster lookup by upload_token
CREATE INDEX idx_mcu_uploads_upload_token ON mcu_uploads(upload_token);

-- Index for faster lookup by user_id
CREATE INDEX idx_mcu_uploads_user_id ON mcu_uploads(user_id);
