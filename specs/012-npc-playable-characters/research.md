# Phase 0: Research

## Decisions

- **Decision**: O formulário da ficha completa será renderizado em um Modal/Slide-over.
  **Rationale**: Evitar poluição visual no passo 3 do wizard (que já é denso).
  **Alternatives**: Expandir o formulário verticalmente no passo 3 (rejeitado por prejudicar a UX).

- **Decision**: Salvar os personagens criados como NPCs Jogáveis na tabela `characters`.
  **Rationale**: Fichas de NPCs jogáveis têm a mesma estrutura de fichas de jogadores (tribo, classe, atributos). Isso aproveita a modelagem atual do Supabase e permite que um usuário "assuma" o NPC mais tarde, se associado em `session_participants`.
  **Alternatives**: Salvar na tabela `session_enemies` com `type='npc'` e `stats` JSONB (rejeitado por dificultar a transição para personagem controlável por player).

- **Decision**: Presets serão fixados (hardcoded) num arquivo estático JSON (`npcPresets.json`).
  **Rationale**: Simplifica o MVP da funcionalidade de presets, focado em agilizar o trabalho do Mestre para NPCs simples.
  **Alternatives**: Tabela `npc_presets` no Supabase (rejeitado pois gera overhead de criação de telas de CRUD de presets neste momento).
