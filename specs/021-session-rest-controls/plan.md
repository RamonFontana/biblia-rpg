# Implementation Plan: Controle de Descansos da Sessão (Mestre)

**Branch**: `021-session-rest-controls` | **Date**: 2026-06-17 | **Spec**: [specs/021-session-rest-controls/spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/021-session-rest-controls/spec.md)

**Input**: Feature specification from `/specs/021-session-rest-controls/spec.md`

## Summary

O Mestre terá controles exclusivos para acionar Descanso Curto e Descanso Longo. O Descanso Curto é limitado a 2 por dia (resetados quando o dia vira), e o Descanso Longo é limitado a 1 a cada 2 dias (baseado na evolução do dia da sessão). Jogadores verão indicadores sobre a disponibilidade desses descansos. Ao acionar, o sistema aplicará recuperação de PV e Fé para os personagens.

## Technical Context

**Language/Version**: TypeScript / React 19 / Vite 8

**Primary Dependencies**: React Router DOM, Zustand, Supabase, Tailwind, Radix UI

**Storage**: Supabase PostgreSQL

**Testing**: Vitest

**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge)

**Project Type**: web-app

**Constraints**: Atualização em tempo real para os jogadores conectados via Supabase subscriptions.

## Proposed Changes

### Supabase Database
- **[NEW] Migration**: Criar nova migration SQL para alterar a tabela `game_sessions`:
  - `short_rests_today` (integer, default 0)
  - `last_long_rest_day` (integer, default 1)

### Componentes de Sessão (Frontend)

- **[MODIFY] [ActiveSessionPage.tsx](file:///Users/take5dev1/projects/rpg-biblico/src/pages/session/ActiveSessionPage.tsx)**:
  - Injetar o componente `SessionRestControls` na visão do Mestre (ao lado ou junto dos botões de controle de tempo).
  - Injetar o componente `PlayerRestIndicator` na visão do Jogador.
  - Atualizar a lógica do botão `Avançar` (tempo) para que, quando o dia virar (`current_period === 'Noite' -> 'Manhã'`), a coluna `short_rests_today` seja resetada para `0` no banco.

- **[NEW] [SessionRestControls.tsx](file:///Users/take5dev1/projects/rpg-biblico/src/components/session/SessionRestControls.tsx)**:
  - Painel de botões do mestre para "Descanso Curto" e "Descanso Longo".
  - Habilitado/Desabilitado baseado nas restrições (`short_rests_today < 2` e `current_day - last_long_rest_day >= 2`).
  - Lógica para processar as curas no banco de dados via chamadas Supabase para atualizar a tabela `characters` de todos da sessão de uma vez.

- **[NEW] [PlayerRestIndicator.tsx](file:///Users/take5dev1/projects/rpg-biblico/src/components/session/PlayerRestIndicator.tsx)**:
  - Alerta visual ou selo para os jogadores indicando que um Descanso Curto e/ou Longo está disponível e pode ser solicitado ao mestre.

## Verification Plan

### Manual Verification
1. Entrar como Mestre em uma sessão ativa.
2. Verificar se os botões de descanso respeitam os limites de tempo (2 curtos/dia, 1 longo/2 dias).
3. Entrar como Jogador (em outra janela) e verificar os indicadores atualizando em tempo real baseados nas ações do Mestre.
4. Acionar Descanso Longo como Mestre e verificar se o HP e Fé dos jogadores foram atualizados no banco e na tela.
5. Avançar o período para virar o dia e atestar que os descansos curtos foram zerados.
