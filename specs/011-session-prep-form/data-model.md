# Data Model: Início da Criação de Sessão

Este documento descreve as estruturas de dados e contratos de interface necessários para a funcionalidade de criação e gerenciamento básico de sessões do RPG Bíblico.

## Supabase Tables

A funcionalidade requer as seguintes tabelas novas no banco de dados para suportar as sessões:

### `game_sessions`
Tabela principal que armazena a sessão de jogo.
- `id` (uuid, primary key)
- `name` (text, not null): Nome da sessão.
- `description` (text): Breve sinopse.
- `gm_id` (uuid, not null, references `auth.users`): ID do Mestre de Jogo que criou.
- `status` (text, not null): `'active'`, `'finished'`. (A sessão só é inserida quando criada, então `'draft'` vive no frontend).
- `created_at` (timestamptz, default now())

### `session_enemies`
Armazena as instâncias efêmeras de inimigos para uma sessão.
- `id` (uuid, primary key)
- `session_id` (uuid, references `game_sessions(id) on delete cascade`)
- `base_enemy_id` (text): Referência/Slug para o inimigo no Bestiário (ex: `guerreiro-filisteu`).
- `name` (text): Nome da instância (ex: "Guerreiro Filisteu 1").
- `current_hp` (integer, not null)
- `max_hp` (integer, not null)

### `session_npcs`
Armazena as instâncias efêmeras de NPCs criados para a sessão.
- `id` (uuid, primary key)
- `session_id` (uuid, references `game_sessions(id) on delete cascade`)
- `name` (text, not null)
- `description` (text)
- `stats` (jsonb): Atributos, habilidades e status, se necessário para a sessão.

### `session_participants`
Tabela de relacionamento entre a sessão e os personagens/jogadores convocados.
- `id` (uuid, primary key)
- `session_id` (uuid, references `game_sessions(id) on delete cascade`)
- `character_id` (uuid, references `characters(id) on delete cascade`): O personagem convocado.
- `user_id` (uuid, references `auth.users`): O usuário dono do personagem.
- `joined` (boolean, default false): Se o usuário já entrou na sessão ativa.

## Frontend Local State (Draft)

Durante o preenchimento do Multi-step Form (antes de enviar ao banco), os dados residirão em um estado local:

```typescript
type SessionDraft = {
  // Step 1
  name: string;
  description: string;
  
  // Step 2
  enemies: Array<{
    id: string; // temp id
    base_enemy_id: string;
    name: string;
    max_hp: number;
    current_hp: number;
  }>;
  
  // Step 3
  npcs: Array<{
    id: string; // temp id
    name: string;
    description: string;
    stats?: Record<string, any>;
  }>;
  
  // Step 4
  participantCharacterIds: string[]; // Lista de UUIDs dos personagens selecionados
};
```
