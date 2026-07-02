# Implementation Plan: Efeitos de Armas e Novos Itens

**Branch**: `044-weapon-effects-items` | **Date**: 2026-07-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/044-weapon-effects-items/spec.md`

## Summary

Adicionar 3 novas armas de duas mãos (Espada Grande, Martelo de Guerra, Clava Grande) ao catálogo do jogo e criar uma mecânica para o Mestre atribuir efeitos ofensivos (condições como Sangramento, Envenenamento) a instâncias específicas de armas de cada personagem. O gatilho de ativação é uma rolagem natural de 18+ no d20 (~15% de chance). Os efeitos são armazenados por instância (`character_items`), completamente separados das resistências de armadura (que protegem contra condições).

## Technical Context

**Language/Version**: TypeScript 5.x / React 18

**Primary Dependencies**: React, shadcn/ui, Zustand, Zod, React Hook Form, Supabase JS

**Storage**: PostgreSQL via Supabase (tabelas `items`, `character_items`)

**Testing**: Manual (verificação visual e funcional)

**Target Platform**: Web application (mobile-first, responsive)

**Project Type**: Web application (frontend React + backend Supabase)

**Constraints**: Componentes UI devem usar shadcn/ui. Armas NÃO possuem resistências a condições (exclusivo de armaduras).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Justificativa |
|-----------|--------|---------------|
| I. Sem Magia Arcana | ✅ PASSA | Os efeitos de arma são mundanos (lâmina serrilhada, veneno, etc.), não mágicos |
| II. Sem Itens Mágicos | ✅ PASSA | Nenhuma arma recebe bônus sobrenatural. Efeitos são justificados por materiais (bronze, ferro, veneno natural) |
| III. Sistema de Fé | ✅ PASSA | Não interfere no Sistema de Fé |
| IV. Tribos como Raças | ✅ PASSA | Não afeta tribos |
| V. Regra de Levi | ✅ PASSA | Armas marciais continuam inacessíveis a Sacerdotes/Sábios por proficiência |
| VI. Documentação como Fonte de Verdade | ✅ PASSA | `docs/itens/armas.md` será atualizado com as novas armas e a mecânica de efeitos |

## Project Structure

### Documentation (this feature)

```text
specs/044-weapon-effects-items/
├── plan.md              # Este arquivo
├── research.md          # Decisões de design
├── data-model.md        # Modelo de dados
└── tasks.md             # Tarefas (gerado via /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── data/
│   ├── itemsDb.ts              # [MODIFY] Adicionar 3 novas armas
│   └── conditions.ts           # [READ] Catálogo de condições (sem alteração)
├── types/
│   ├── combat.ts               # [MODIFY] Adicionar tipo WeaponEffect
│   └── database.types.ts       # [MODIFY] Regenerar após migration
├── lib/
│   └── equipmentUtils.ts       # [MODIFY] Extrair weapon_effects do inventário
├── services/
│   └── combatEngine.ts         # [MODIFY] Processar efeitos de arma no ataque
├── components/
│   ├── inventory/
│   │   └── InventoryList.tsx    # [MODIFY] Adicionar botão/dropdown de efeitos (somente armas) + condicionar resistências (somente armaduras)
│   ├── combat/
│   │   └── PhysicalRollForm.tsx # [MODIFY] Passar natural d20 para verificação de gatilho
│   └── ui/
│       └── (shadcn components)  # [READ] Reutilizar Dialog, Select, Badge, DropdownMenu, Tooltip
├── features/
│   └── character-management/
│       └── api/
│           └── syncInventory.ts # [MODIFY] Incluir novas armas no sync
docs/
└── itens/
    └── armas.md                # [MODIFY] Adicionar novas armas + seção de efeitos
```

**Structure Decision**: Segue a estrutura existente do projeto. Não são necessárias novas pastas ou componentes completamente novos — os arquivos existentes serão expandidos com a nova funcionalidade.

## Fases de Implementação

### Fase 1: Dados e Banco (Foundation)

**Objetivo**: Adicionar as novas armas e a coluna `weapon_effects` no banco.

#### 1.1 Migration Supabase
- Executar migration SQL para adicionar coluna `weapon_effects` (jsonb) na tabela `character_items`.
- Inserir os 3 novos itens de armas na tabela `items`.
- Usar o MCP do Supabase (`apply_migration` ou `execute_sql`) para executar as queries.

#### 1.2 Atualizar `ITEMS_DB` (`src/data/itemsDb.ts`)
- Adicionar as 3 novas armas com os dados definidos no `data-model.md`.
- Propriedades: `['two-handed', 'heavy']` para todas.
- IDs: `espada_grande`, `martelo_guerra`, `clava_grande`.

#### 1.3 Atualizar Tipos TypeScript
- Adicionar `WeaponEffect` interface em `src/types/combat.ts`.
- Regenerar `database.types.ts` para incluir `weapon_effects` em `character_items`.

#### 1.4 Atualizar Documentação
- Adicionar as 3 armas na tabela de `docs/itens/armas.md`.
- Adicionar seção "Efeitos de Arma" explicando a mecânica (Natural 18+, configuração pelo Mestre).

### Fase 2: UI do Mestre — Atribuir Efeitos

**Objetivo**: Permitir que o Mestre configure efeitos ofensivos em armas pelo inventário.

#### 2.1 Modificar `InventoryList.tsx`
- **Diferenciar botões por tipo de item**:
  - Armaduras/Escudos/Elmos → Mostrar botão de Resistências (ShieldPlus) ← JÁ EXISTE, manter
  - Armas → Mostrar novo botão de Efeitos de Arma (ícone `Zap` ou `Flame`)
  - Itens consumíveis/utilidade → Nenhum botão especial
- **Novo Dropdown de Efeitos** (somente para `isGM` e tipo `Arma`):
  - Usar componentes shadcn/ui: `DropdownMenu` + `DropdownMenuCheckboxItem` (mesmo padrão das resistências)
  - Listar as condições de `CONDITIONS` do `conditions.ts` como opções
  - Ao marcar/desmarcar, persistir no `weapon_effects` do `character_items` via Supabase
- **Badge visual**: Exibir badges coloridos (ex: `⚔️ Sangramento`) quando a arma tem efeitos configurados.

#### 2.2 Serviço de Persistência
- Reutilizar o padrão de `onChangeResistances` existente, criando uma função `onChangeWeaponEffects` para persistir no campo `weapon_effects` do `character_items`.
- Adicionar na `CharacterSheetView.tsx` o handler para o novo callback.

### Fase 3: Motor de Combate — Ativação de Efeitos

**Objetivo**: Quando um ataque cumpre o gatilho (nat 18+), sugerir/aplicar a condição ao alvo.

#### 3.1 Modificar `PhysicalRollForm.tsx`
- Adicionar campo opcional `naturalRoll` (número de 1-20) para o jogador informar o resultado natural do d20 (sem modificadores).
- Se o `naturalRoll >= 18` e a arma equipada tem `weapon_effects`, exibir alerta visual ao Mestre.

#### 3.2 Expandir `combatEngine.ts`
- Criar novo método `checkWeaponEffects(attackerCharacterItemId, naturalRoll, targetParticipantId)`:
  - Buscar `weapon_effects` do `character_items` do atacante.
  - Verificar se o gatilho é cumprido (`natural_18_plus` → `naturalRoll >= 18`).
  - Se sim, verificar resistências da armadura do alvo (via lógica já existente).
  - Aplicar a condição ou exibir toast informativo.

#### 3.3 Integração com Resistência de Armadura
- Ao tentar aplicar efeito de arma, chamar a mesma lógica de `maxResistanceLevel` que já existe no `combatEngine.ts` (linhas 30-96).
- Se o alvo tem resistência à condição, respeitar os níveis (Nv1-4) — incluindo imunidade (Nv4).

## Componentes shadcn/ui Utilizados

| Componente | Uso | Já existe? |
|-----------|-----|-----------|
| `DropdownMenu` + `DropdownMenuCheckboxItem` | Dropdown de seleção de efeitos | ✅ Sim |
| `Badge` | Exibir efeitos configurados no item | ✅ Sim |
| `Tooltip` | Mostrar detalhes do efeito ao hover | ✅ Sim |
| `Dialog` | Modal de confirmação (se necessário) | ✅ Sim |
| `Select` | Campo de seleção do naturalRoll (1-20) | ✅ Sim |
| `Button` | Botão de ação | ✅ Sim |

Todos os componentes necessários já estão instalados no projeto.

## Complexity Tracking

> Nenhuma violação de constituição detectada. Nenhuma complexidade adicional necessária.
