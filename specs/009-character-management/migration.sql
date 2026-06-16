-- Migração para RLS em Character Management

-- Assegure-se de que a coluna has_participated_in_session exista
ALTER TABLE characters ADD COLUMN IF NOT EXISTS has_participated_in_session BOOLEAN DEFAULT false;

-- Habilitar RLS se não estiver
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- 1. Permite usuários verem seus próprios personagens
CREATE POLICY "Users can view their own characters"
ON characters
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Permite usuários inserirem seus próprios personagens
CREATE POLICY "Users can insert their own characters"
ON characters
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Permite edição APENAS se não tiver participado de sessão
CREATE POLICY "Users can update their own characters if not in session"
ON characters
FOR UPDATE
USING (auth.uid() = user_id AND has_participated_in_session = false);

-- 4. Permite deletar APENAS se não tiver participado de sessão (opcional)
CREATE POLICY "Users can delete their own characters if not in session"
ON characters
FOR DELETE
USING (auth.uid() = user_id AND has_participated_in_session = false);
