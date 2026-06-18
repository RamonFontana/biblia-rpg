# Research: Sistema de Negociação e Lojinha

**Date**: 2026-06-18 | **Branch**: `023-trade-shop-system`

## Findings

### 1. Schema Atual do Banco de Dados

**Decision**: Utilizar e estender as tabelas existentes no Supabase.

**Rationale**: O projeto já possui um esquema funcional com as entidades necessárias para suportar o sistema de trocas. A coluna `coins` já existe.

**Schema `characters` (colunas relevantes)**:
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `name`, `tribe`, `vocation` (text)
- `stats` (jsonb) — contém `pv`, `current_pv`, `ca`, `faith`, `current_faith`
- `equipment` (jsonb, default `[]`)
- **`coins` (integer, default 0)** ← JÁ EXISTE! Não precisa de migração.
- `is_npc` (boolean, default false)
- `is_visible` (boolean, default true)

**Schema `items` (colunas existentes)**:
- `id`, `name`, `description`, `category`, `is_consumable`, `requires_target`, `is_kit`, `weight`, `effects`
- **NÃO TEM `price`** → Precisa de migração para adicionar coluna `price` (integer, default NULL).

**Schema `character_items` (inventário)**:
- `id`, `character_id` (FK), `item_id` (FK), `quantity` (integer), `created_at`
- UNIQUE(character_id, item_id)

**Schema `session_npcs` (NPCs simples)**:
- `id`, `session_id` (FK), `name`, `description`, `stats` (jsonb), `is_visible`, `created_at`
- Não possuem inventário real (`character_items`).

**Alternatives considered**: Criar nova tabela de moedas separada → rejeitado, `coins` já é coluna nativa.

---

### 2. Tempo Real (Realtime)

**Decision**: Usar Supabase Realtime (`postgres_changes`) para sincronizar negociações em tempo real, igual ao padrão já usado no projeto.

**Rationale**: O projeto já utiliza `supabase.channel().on('postgres_changes', ...)` extensivamente (sessões, NPCs, testes, items). Manter o mesmo padrão.

**Alternatives considered**: WebSocket customizado → rejeitado por complexidade; Polling → rejeitado por latência.

---

### 3. Transações Atômicas

**Decision**: Usar uma RPC `execute_trade` no Supabase (função PL/pgSQL `SECURITY DEFINER`) para executar a transação inteira de forma atômica.

**Rationale**: A transferência de itens e moedas entre dois personagens deve ser feita em uma única transação para evitar estados inconsistentes (ex: um lado debita mas o outro não credita). O projeto já usa este padrão (`add_kit_to_character`, `create_game_session`).

**Alternatives considered**: Múltiplos updates via client → rejeitado, não é atômico e vulnerável a race conditions.

---

### 4. Indicador de "Negociando" (Busy State)

**Decision**: Derivar o estado "Negociando" em tempo real a partir da presença de uma negociação ativa na tabela `trades` para os personagens envolvidos, sem campo adicional na tabela `characters`.

**Rationale**: Adicionar `is_trading` como coluna no `characters` criaria estado desnecessário que poderia ficar desatualizado. É mais seguro derivar: "se o personagem está em um trade com status 'active', ele está negociando". Isso é consistente com o padrão de `isBusy` já usado para testes (derivado de `activeTests`).

**Alternatives considered**: Coluna `is_trading` em `characters` → rejeitado por risco de estado stale e redundância.

---

### 5. Fluxo de Aceite de Negociação

**Decision**: Usar o campo `status` da tabela `trades` para representar o fluxo: `pending` → `active` → `completed`/`cancelled`.

**Rationale**: 
- Negociação entre jogadores: criada com status `pending`, muda para `active` quando destinatário aceita (FR-013).
- Lojinha do Mestre: criada diretamente com status `active` (FR-014), sem etapa de aceite.
- Negociação com NPC: criada com status `pending`, Mestre aceita.
