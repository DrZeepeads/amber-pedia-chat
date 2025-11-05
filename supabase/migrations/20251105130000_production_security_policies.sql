-- Drop existing public policies
DROP POLICY IF EXISTS "nelson_conversations_public_select" ON nelson_conversations;
DROP POLICY IF EXISTS "nelson_conversations_public_insert" ON nelson_conversations;
DROP POLICY IF EXISTS "nelson_conversations_public_update" ON nelson_conversations;
DROP POLICY IF EXISTS "nelson_conversations_public_delete" ON nelson_conversations;
DROP POLICY IF EXISTS "nelson_messages_public_select" ON nelson_messages;
DROP POLICY IF EXISTS "nelson_messages_public_insert" ON nelson_messages;
DROP POLICY IF EXISTS "nelson_user_settings_public_select" ON nelson_user_settings;
DROP POLICY IF EXISTS "nelson_user_settings_public_insert" ON nelson_user_settings;
DROP POLICY IF EXISTS "nelson_user_settings_public_update" ON nelson_user_settings;

-- Conversations: Users can only access their own
CREATE POLICY "conversations_select_own" ON nelson_conversations
  FOR SELECT USING (auth.uid() = user_sub::uuid);

CREATE POLICY "conversations_insert_own" ON nelson_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_sub::uuid);

CREATE POLICY "conversations_update_own" ON nelson_conversations
  FOR UPDATE USING (auth.uid() = user_sub::uuid);

CREATE POLICY "conversations_delete_own" ON nelson_conversations
  FOR DELETE USING (auth.uid() = user_sub::uuid);

-- Messages: Users can only access messages in their conversations
CREATE POLICY "messages_select_own" ON nelson_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM nelson_conversations
      WHERE id = nelson_messages.conversation_id
      AND user_sub::uuid = auth.uid()
    )
  );

CREATE POLICY "messages_insert_own" ON nelson_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM nelson_conversations
      WHERE id = nelson_messages.conversation_id
      AND user_sub::uuid = auth.uid()
    )
  );

-- User Settings: Users can only access their own
CREATE POLICY "settings_select_own" ON nelson_user_settings
  FOR SELECT USING (auth.uid() = user_sub::uuid);

CREATE POLICY "settings_insert_own" ON nelson_user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_sub::uuid);

CREATE POLICY "settings_update_own" ON nelson_user_settings
  FOR UPDATE USING (auth.uid() = user_sub::uuid);

-- Add rate limiting table
CREATE TABLE IF NOT EXISTS nelson_rate_limits (
  user_sub UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_sub, action, window_start)
);

-- Function to check rate limits (100 messages per hour)
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_sub UUID,
  p_action VARCHAR(50),
  p_max_count INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Clean old entries
  DELETE FROM nelson_rate_limits
  WHERE window_start < NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get current count
  SELECT COALESCE(SUM(count), 0) INTO current_count
  FROM nelson_rate_limits
  WHERE user_sub = p_user_sub
  AND action = p_action
  AND window_start > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Check limit
  IF current_count >= p_max_count THEN
    RETURN FALSE;
  END IF;
  
  -- Increment counter
  INSERT INTO nelson_rate_limits (user_sub, action, count, window_start)
  VALUES (p_user_sub, p_action, 1, NOW())
  ON CONFLICT (user_sub, action, window_start)
  DO UPDATE SET count = nelson_rate_limits.count + 1;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
