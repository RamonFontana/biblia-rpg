-- 1. Criação de Tipos Enumerados
CREATE TYPE session_status AS ENUM ('planning', 'active', 'finished');
CREATE TYPE time_of_day AS ENUM ('morning', 'afternoon', 'night');
CREATE TYPE enemy_type AS ENUM ('enemy', 'npc');

-- 2. Modificação da tabela characters
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS level INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS experience INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_pv INT,
ADD COLUMN IF NOT EXISTS current_faith INT,
ADD COLUMN IF NOT EXISTS is_dead BOOLEAN DEFAULT false;

-- 3. Criação das tabelas de Sessão
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status session_status DEFAULT 'planning',
  time_of_day time_of_day DEFAULT 'morning',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(session_id, character_id)
);

CREATE TABLE session_enemies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  max_pv INT NOT NULL,
  current_pv INT NOT NULL,
  ca INT NOT NULL,
  type enemy_type DEFAULT 'enemy',
  stats JSONB DEFAULT '{}'::jsonb,
  conditions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. RLS e Segurança
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_enemies ENABLE ROW LEVEL SECURITY;

-- Políticas de Sessão (Sessions)
-- Todos podem ver sessões
CREATE POLICY "Users can view sessions" ON sessions FOR SELECT USING (true);
-- Mestre pode inserir, alterar e deletar
CREATE POLICY "Master can insert sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = master_id);
CREATE POLICY "Master can update their sessions" ON sessions FOR UPDATE USING (auth.uid() = master_id);
CREATE POLICY "Master can delete their sessions" ON sessions FOR DELETE USING (auth.uid() = master_id);

-- Políticas de Participantes (Session Participants)
-- Todos podem ver participantes
CREATE POLICY "Users can view participants" ON session_participants FOR SELECT USING (true);
-- Usuários ou Mestre podem inserir personagens na sessão
CREATE POLICY "Users can join sessions" ON session_participants FOR INSERT WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_id AND sessions.master_id = auth.uid())
);
CREATE POLICY "Users can leave sessions" ON session_participants FOR DELETE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_id AND sessions.master_id = auth.uid()));

-- Políticas de Inimigos (Session Enemies)
-- Todos podem ver inimigos
CREATE POLICY "Users can view enemies" ON session_enemies FOR SELECT USING (true);
-- Somente o mestre da sessão pode inserir, atualizar ou deletar
CREATE POLICY "Master can manage enemies" ON session_enemies FOR ALL USING (
  EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_id AND sessions.master_id = auth.uid())
);

-- 5. Configuração do Realtime no Supabase
-- Garante que as tabelas sejam replicadas no realtime
alter publication supabase_realtime add table characters;
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table session_enemies;
