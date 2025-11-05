-- Strengthen RLS: user-scoped access for Nelson-GPT

-- Drop previous public policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can view all conversations" ON public.nelson_conversations;
  DROP POLICY IF EXISTS "Public can create conversations" ON public.nelson_conversations;
  DROP POLICY IF EXISTS "Public can update conversations" ON public.nelson_conversations;
  DROP POLICY IF EXISTS "Public can delete conversations" ON public.nelson_conversations;
  DROP POLICY IF EXISTS "Public can view all messages" ON public.nelson_messages;
  DROP POLICY IF EXISTS "Public can create messages" ON public.nelson_messages;
  DROP POLICY IF EXISTS "Public can view settings" ON public.nelson_user_settings;
  DROP POLICY IF EXISTS "Public can insert settings" ON public.nelson_user_settings;
  DROP POLICY IF EXISTS "Public can update settings" ON public.nelson_user_settings;
END $$;

-- Conversations: only owner can read/write
CREATE POLICY "Users read own conversations"
  ON public.nelson_conversations FOR SELECT
  USING (auth.uid() = user_sub::uuid OR auth.uid()::text = user_sub);

CREATE POLICY "Users insert own conversations"
  ON public.nelson_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_sub::uuid OR auth.uid()::text = user_sub);

CREATE POLICY "Users update own conversations"
  ON public.nelson_conversations FOR UPDATE
  USING (auth.uid() = user_sub::uuid OR auth.uid()::text = user_sub);

CREATE POLICY "Users delete own conversations"
  ON public.nelson_conversations FOR DELETE
  USING (auth.uid() = user_sub::uuid OR auth.uid()::text = user_sub);

-- Messages: enforce ownership via conversation
CREATE POLICY "Users read own messages"
  ON public.nelson_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.nelson_conversations c
      WHERE c.id = conversation_id AND (auth.uid() = c.user_sub::uuid OR auth.uid()::text = c.user_sub)
    )
  );

CREATE POLICY "Users insert messages in own conversations"
  ON public.nelson_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.nelson_conversations c
      WHERE c.id = conversation_id AND (auth.uid() = c.user_sub::uuid OR auth.uid()::text = c.user_sub)
    )
  );

CREATE POLICY "Users update messages in own conversations"
  ON public.nelson_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.nelson_conversations c
      WHERE c.id = conversation_id AND (auth.uid() = c.user_sub::uuid OR auth.uid()::text = c.user_sub)
    )
  );

CREATE POLICY "Users delete messages in own conversations"
  ON public.nelson_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.nelson_conversations c
      WHERE c.id = conversation_id AND (auth.uid() = c.user_sub::uuid OR auth.uid()::text = c.user_sub)
    )
  );

-- User settings: owner only
CREATE POLICY "Users read own settings"
  ON public.nelson_user_settings FOR SELECT
  USING (auth.uid() = user_sub::uuid OR auth.uid()::text = user_sub);

CREATE POLICY "Users insert own settings"
  ON public.nelson_user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_sub::uuid OR auth.uid()::text = user_sub);

CREATE POLICY "Users update own settings"
  ON public.nelson_user_settings FOR UPDATE
  USING (auth.uid() = user_sub::uuid OR auth.uid()::text = user_sub);

-- Keep textbook chunks public read-only
DO $$ BEGIN
  DROP POLICY IF EXISTS "Anyone can read nelson textbook chunks" ON public.nelson_textbook_chunks;
END $$;
CREATE POLICY "Anyone can read nelson textbook chunks"
  ON public.nelson_textbook_chunks FOR SELECT
  USING (true);
