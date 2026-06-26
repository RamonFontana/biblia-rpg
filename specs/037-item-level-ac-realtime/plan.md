# Implementation Plan: 037-item-level-ac-realtime

**Branch**: `037-item-level-ac-realtime` | **Date**: 2026-06-25 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/037-item-level-ac-realtime/spec.md)

**Input**: Feature specification from `/specs/037-item-level-ac-realtime/spec.md`

## Summary

Adicionar um sistema de nível (1-5) aos itens do inventário que concede bônus de CA acumulativo para armaduras e escudos (CA extra = Nível - 1). O nível do item só pode ser alterado pelo mestre e suas mudanças — bem como as de CA ao equipar/desequipar — refletem em tempo real para toda a mesa graças ao canal Supabase já existente na aplicação.

## Technical Context

**Language/Version**: TypeScript / React

**Primary Dependencies**: Supabase (JS client), React

**Storage**: Supabase PostgreSQL

**Testing**: N/A (A manual test plan will be detailed below based on user scenarios)

**Target Platform**: Web Browser

**Project Type**: Web Application (React SPA)

**Performance Goals**: < 3s real-time update

**Constraints**: Must leverage existing Supabase realtime publication without breaking the established data structure

**Scale/Scope**: Session level (up to ~10 players/spectators per session)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- I. Fidelidade Bíblica (Sem Magia Arcana) -> **PASS**: Melhorias representam qualidade física/ferreiro.
- II. Materialismo Histórico (Sem Itens Mágicos) -> **PASS**: Sem propriedades mágicas introduzidas.
- III. Sistema de Fé como Núcleo -> **PASS**: N/A.
- IV. Tribos como Raças -> **PASS**: N/A.
- V. A Regra de Levi -> **PASS**: N/A.
- VI. Documentação como Fonte de Verdade -> **PASS**: Especificações, modelo de dados e pesquisa devidamente gerados e versionados em `docs` e `specs/`.

## Project Structure

### Documentation (this feature)

```text
specs/037-item-level-ac-realtime/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
supabase/migrations/
├── [timestamp]_add_item_level.sql # DB Migration

src/
├── types/
│   └── database.types.ts          # Type updates
├── lib/
│   └── equipmentUtils.ts          # CA logic recalculation
├── components/
│   ├── inventory/
│   │   ├── EquipmentSlots.tsx     # Display level in slots
│   │   ├── CharacterInventory.tsx # Display level in list & handle GM edit
│   └── session/
│       └── SessionPlayers.tsx     # Realtime listeners (already exist, verify effect)
```

**Structure Decision**: A implementação toca camadas de persistência (DB + Types), domínio de negócio (`equipmentUtils.ts`) e apresentação visual no inventário. O fluxo do Realtime (SessionPlayers) não requer código novo, pois o Supabase já emite as atualizações dos registros.

## User Review Required
> [!IMPORTANT]
> - A migração do banco de dados adiciona o campo `level` como `NOT NULL DEFAULT 1`. Verifique se isso está adequado.
> - O RLS do Supabase precisa estar configurado para permitir que o mestre (GM) da sessão faça UPDATE na tabela `character_items` na coluna `level`, mas que o jogador dono só consiga fazer UPDATE em colunas de equipamento/status e não na coluna `level` diretamente. Atualmente, os jogadores podem atualizar `character_items` (para equipar/dropar)? A política RLS atual precisará de escrutínio no momento da implementação das tasks.

## Open Questions
> [!WARNING]
> Nenhuma no momento, todas resolvidas na especificação.

## Proposed Changes

---

### Supabase / DB Layer
#### [NEW] [timestamp]_add_item_level.sql
- Adiciona a coluna `level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 5)` na tabela `character_items`.
- Adiciona a coluna `level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 5)` na tabela `trade_items`.

#### [MODIFY] database.types.ts
- Reflete a adição do atributo `level` em `CharacterItem` e `TradeItem`.

---

### Business Logic
#### [MODIFY] equipmentUtils.ts
- Atualizar a função `getCombatStats` (e suas dependências, se houver) para somar `(item.level - 1)` à CA base para os itens do tipo 'Armadura' e 'Escudo'.

---

### Frontend Components
#### [MODIFY] EquipmentSlots.tsx
- Renderizar o nível atual do item ao lado do nome da armadura/escudo quando equipado.

#### [MODIFY] CharacterInventory.tsx (ou componente respectivo de listagem de itens)
- Exibir a tag de nível (Ex: "Nv. 3") na lista.
- Adicionar um pequeno botão de "+" e "-" ou select (apenas visível se o usuário ativo for o GM da sessão) para alterar o nível de `1` a `5`.
- Fazer a chamada ao Supabase (`supabase.from('character_items').update({ level: X }).eq('id', itemId)`) ao alterar o nível.

## Verification Plan

### Manual Verification
- Acessar o ambiente de desenvolvimento local.
- Entrar numa sessão como Jogador e abrir o inventário de seu personagem: não deve ver opção de alterar nível.
- Entrar na mesma sessão como GM e abrir a ficha do mesmo personagem: deve ver a opção de alterar o nível.
- Mudar o nível da armadura do jogador de 1 para 3.
- Na tela do jogador, a armadura agora diz Nível 3, e o cálculo na ficha deve mostrar CA atualizado automaticamente.
- Mudar equipamentos no corpo para ver a CA refletir `(nível - 1)` no frontend instantaneamente.
