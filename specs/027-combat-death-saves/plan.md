# Implementation Plan: Sistema de Combate - Teste de Morte e Fim de Combate

**Branch**: `027-combat-death-saves` | **Date**: 2026-06-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/027-combat-death-saves/spec.md`

## Summary

Implementar a mecânica de Teste de Morte para personagens com 0 PV, incluindo suporte a rolagens de dados (automáticas/manuais), controle de estado de morte, finalização de combate e ações do mestre para controlar a vida e a morte (incluindo curar aliados e *soft delete* de personagens mortos no fim da batalha). Tudo com atualização em tempo real usando Supabase Realtime.

## Technical Context

**Language/Version**: TypeScript / React

**Primary Dependencies**: React, Supabase (para Realtime e DB), TailwindCSS, React Router, Lucide React (ícones)

**Storage**: Supabase PostgreSQL (Tabelas: `combat_sessions`, `combat_participants`, `characters`)

**Testing**: Não especificado estritamente (validação manual e visual em tela)

**Target Platform**: Web (Navegadores modernos)

**Project Type**: Web Application (React App)

**Performance Goals**: Sincronização em tempo real (tempo de reflexo na tela de < 1 segundo)

**Constraints**: O estado deve estar perfeitamente sincronizado entre o painel do Mestre e a tela do Jogador. 

**Scale/Scope**: Modificação de componentes existentes do Mestre e do Jogador na sessão ativa, adição de novos modais para Teste de Morte.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Sem Magia Arcana**: PASS - A cura que levanta do estado de morte não usa magia arcana, baseia-se nas mecânicas de itens, milagres ou ações naturais.
- **II. Sem Itens Mágicos**: PASS - Sem impacto.
- **III. Sistema de Fé**: PASS - Sem impacto na degradação, embora milagres possam curar.
- **IV/V. Tribos/Levitas**: PASS - Sem impacto direto.
- **VI. Documentação**: PASS - A mecânica de morte é padrão do D&D, adaptada para o VTT, e está formalizada em `spec.md`.

## Project Structure

### Documentation (this feature)

```text
specs/027-combat-death-saves/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (generated later)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── combat/
│   │   ├── PlayerCombatView.tsx          # Atualizar para mostrar Teste de Morte
│   │   ├── MasterCombatControls.tsx      # Atualizar com botão de finalizar combate
│   │   ├── DeathSavesModal.tsx           # NOVO: Interface de rolagem de morte
│   │   ├── MasterDeathSavesControl.tsx   # NOVO: Controles do Mestre
│   ├── session/
│   │   ├── CharacterCard.tsx             # Atualizar para refletir estado Morrendo
├── pages/
│   ├── session/
│   │   └── ActiveSessionPage.tsx         # Integrar eventos de fim de combate e morte
├── types/
│   └── database.types.ts                 # Atualizar tipos com novas colunas
```

**Structure Decision**: A implementação se baseará nas pastas de `components/combat` e `components/session`, onde a interface já existe. Novos modais serão criados para isolar a lógica de Teste de Morte.

## Complexity Tracking

Nenhuma violação ou complexidade excessiva encontrada. Utilizaremos o sistema de Realtime existente no Supabase.
