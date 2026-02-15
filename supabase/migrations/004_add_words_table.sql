-- Valid words table for guess validation
CREATE TABLE IF NOT EXISTS words (
  word TEXT PRIMARY KEY,
  length INT GENERATED ALWAYS AS (char_length(word)) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by length (for puzzle generation)
CREATE INDEX IF NOT EXISTS idx_words_length ON words(length);

-- RLS: Anyone can read words (needed for validation)
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Words are publicly readable"
  ON words FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Only service role can modify words"
  ON words FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
