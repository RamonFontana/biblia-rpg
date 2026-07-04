# Feature Specification: Otimização de Realtime da Sessão

**Feature Branch**: `049-session-realtime-opt`

**Created**: 2026-07-03

**Status**: Draft

**Input**: User description: "Na verdade não quero criar nenhuma parte nova de chat ou algo do tipo, só quero ajustar as telas para configurar certinho o realtime no qual achei alguns problemas"

## Clarifications

### Session 2026-07-03

- Q: O escopo inclui a criação de um novo chat? → A: Não. O escopo é estritamente corrigir e otimizar os hooks de realtime já existentes na sessão para que as atualizações funcionem perfeitamente sem problemas de performance.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Atualizações Síncronas Corretas e Sem Delay (Priority: P1)

Como jogador ou Mestre, eu quero que, ao perder HP ou mudar um status de outro personagem (ou dados de trocas/testes), a interface atualize corretamente na minha tela e na dos outros sem bugs, delays ou requests excessivos.

**Why this priority**: O sistema de realtime atual apresenta problemas (como N+1 fetches ou loops) ao atualizar o banco, o que trava a UI ou causa dessincronização.

**Independent Test**: Modificar o HP de um personagem com a tela do Mestre e Jogador abertas lado a lado, e garantir que a tela de todos atualiza rapidamente e os dados mantêm a consistência, sem gerar multiplos SELECTs no log de network.

**Acceptance Scenarios**:

1. **Given** uma sessão de RPG ativa, **When** um HP/status muda, **Then** as fichas se atualizam instantaneamente lendo do `payload.new`.
2. **Given** uma troca (trade) sendo alterada, **When** um item é adicionado, **Then** a janela de troca atualiza sem delay via realtime.
3. **Given** um teste sendo rolado, **When** o resultado muda, **Then** a janela de teste de todos atualiza corretamente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST reconfigurar os hooks `useSessionCharacters`, `useSessionTrades` e `useSessionTests` para aplicarem as alterações de `postgres_changes` diretamente na state store local usando `payload.new`, corrigindo quaisquer anomalias de realtime existentes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sem fetches completos do banco (SELECT) desencadeados automaticamente por updates no canal de realtime.
- **SC-002**: Interface reage a mudanças na sessão (como dano, itens) em menos de 100ms.

## Assumptions

- Toda a lógica de chat e logs interativos discutidos anteriormente foram descartados. Foco 100% na correção da fundação técnica do Realtime.
