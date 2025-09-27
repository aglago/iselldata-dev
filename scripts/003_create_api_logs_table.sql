-- Create table to track individual API requests to Hubnet
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL DEFAULT 'POST',
  request_data JSONB,
  response_data JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  order_id VARCHAR(255),
  network VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX idx_api_logs_network ON api_logs(network);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at);
CREATE INDEX idx_api_logs_success ON api_logs(success);
CREATE INDEX idx_api_logs_order_id ON api_logs(order_id);

-- Add RLS policy
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations (server-side API logging doesn't use auth context)
-- This is safe because api_logs is only written to by server-side code
CREATE POLICY "Enable all for api logging" ON api_logs
  FOR ALL USING (true)
  WITH CHECK (true);