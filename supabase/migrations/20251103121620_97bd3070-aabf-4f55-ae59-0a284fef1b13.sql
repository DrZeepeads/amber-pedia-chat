-- Create nelson_textbook_chunks table for RAG
CREATE TABLE IF NOT EXISTS public.nelson_textbook_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_title TEXT NOT NULL DEFAULT 'Nelson Textbook of Pediatrics',
  chapter_title TEXT,
  section_title TEXT,
  page_number INTEGER,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS nelson_chunks_embedding_idx ON public.nelson_textbook_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create text search index
CREATE INDEX IF NOT EXISTS nelson_chunks_text_idx ON public.nelson_textbook_chunks 
USING gin(to_tsvector('english', chunk_text));

-- Create nelson_conversations table (separate from existing chat_conversations)
CREATE TABLE IF NOT EXISTS public.nelson_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_sub TEXT,
  title TEXT DEFAULT 'Untitled',
  mode TEXT DEFAULT 'academic' CHECK (mode IN ('academic', 'clinical')),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create nelson_messages table (separate from existing chat_messages)
CREATE TABLE IF NOT EXISTS public.nelson_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.nelson_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create nelson_user_settings table
CREATE TABLE IF NOT EXISTS public.nelson_user_settings (
  user_sub TEXT PRIMARY KEY,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  ai_style TEXT DEFAULT 'balanced' CHECK (ai_style IN ('concise', 'balanced', 'detailed')),
  show_disclaimers BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.nelson_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nelson_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nelson_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nelson_textbook_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies - allow public access for MVP
CREATE POLICY "Public can view all conversations"
  ON public.nelson_conversations FOR SELECT
  USING (true);

CREATE POLICY "Public can create conversations"
  ON public.nelson_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update conversations"
  ON public.nelson_conversations FOR UPDATE
  USING (true);

CREATE POLICY "Public can delete conversations"
  ON public.nelson_conversations FOR DELETE
  USING (true);

-- RLS Policies for nelson_messages
CREATE POLICY "Public can view all messages"
  ON public.nelson_messages FOR SELECT
  USING (true);

CREATE POLICY "Public can create messages"
  ON public.nelson_messages FOR INSERT
  WITH CHECK (true);

-- RLS Policies for nelson_user_settings
CREATE POLICY "Public can view settings"
  ON public.nelson_user_settings FOR SELECT
  USING (true);

CREATE POLICY "Public can insert settings"
  ON public.nelson_user_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update settings"
  ON public.nelson_user_settings FOR UPDATE
  USING (true);

-- RLS Policies for nelson_textbook_chunks (public read access)
CREATE POLICY "Anyone can read nelson textbook chunks"
  ON public.nelson_textbook_chunks FOR SELECT
  USING (true);

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION match_nelson_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  chapter_title text,
  section_title text,
  page_number int,
  chunk_text text,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    nelson_textbook_chunks.id,
    nelson_textbook_chunks.chapter_title,
    nelson_textbook_chunks.section_title,
    nelson_textbook_chunks.page_number,
    nelson_textbook_chunks.chunk_text,
    1 - (nelson_textbook_chunks.embedding <=> query_embedding) as similarity
  FROM nelson_textbook_chunks
  WHERE 1 - (nelson_textbook_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY nelson_textbook_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_nelson_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nelson_conversations_updated_at
  BEFORE UPDATE ON public.nelson_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_nelson_updated_at();

CREATE TRIGGER update_nelson_user_settings_updated_at
  BEFORE UPDATE ON public.nelson_user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_nelson_updated_at();