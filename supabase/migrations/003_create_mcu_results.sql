-- 003_create_mcu_results.sql
-- Create MCU results table for parsed medical check-up parameters

CREATE TABLE mcu_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES mcu_uploads(id),
  user_id UUID REFERENCES profiles(id),
  category TEXT NOT NULL,
  parameter_name TEXT NOT NULL,
  value NUMERIC,
  unit TEXT,
  normal_range_min NUMERIC,
  normal_range_max NUMERIC,
  status TEXT CHECK (status IN ('normal', 'warning', 'critical')),
  notes TEXT,
  checked_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookup by user_id
CREATE INDEX idx_mcu_results_user_id ON mcu_results(user_id);

-- Index for faster lookup by upload_id
CREATE INDEX idx_mcu_results_upload_id ON mcu_results(upload_id);

-- Index for filtering by category
CREATE INDEX idx_mcu_results_category ON mcu_results(category);
