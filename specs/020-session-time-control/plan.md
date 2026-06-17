# Implementation Plan: Controle de Tempo da Sessão

**Branch**: `020-session-time-control` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/020-session-time-control/spec.md`

## Summary

O sistema permitirá ao mestre avançar o tempo da sessão por diferentes períodos do dia (Manhã -> Tarde -> Noite -> Manhã), exibindo o "DIA" e o "PERÍODO" de forma sincronizada na UI de todos os jogadores. Quando o período avançar de "Noite" para "Manhã", os jogadores conectados receberão uma notificação pop-up informando sobre o novo dia.

## User Review Required

Nenhum no momento. As regras base já suportam as necessidades e o esquema de dados precisará apenas de uma modificação no banco (Supabase) adicionando duas colunas novas na tabela `game_sessions`. Se você aprovar o plano, seguiremos com a implementação em código.

## Open Questions

Nenhuma.

## Proposed Changes

### Database Schema (Supabase)
> [!IMPORTANT]
> A tabela `game_sessions` deve receber duas novas colunas via dashboard do Supabase (ou query direta): 
> - `current_day` (int4, default: 1)
> - `current_period` (text, default: 'Manhã')

### src/pages/session/

#### [MODIFY] [ActiveSessionPage.tsx](file:///Users/take5dev1/projects/rpg-biblico/src/pages/session/ActiveSessionPage.tsx)
- Adicionar Badge visível para GM e Jogadores mostrando o `current_day` (Ex: "DIA 1") e o `current_period` (Ex: "Manhã") no Header.
- Adicionar botão "Avançar Tempo" ao lado do botão de dados no Header, restrito ao GM (`isGM === true`).
- A lógica de transição no clique do botão deve ser: `Manhã -> Tarde`, `Tarde -> Noite`, `Noite -> Manhã` (este último também faz `current_day = current_day + 1`).
- Assinar as mudanças no payload do `game_sessions` e verificar se houve uma transição de "Noite" para "Manhã". Se sim, disparar um estado `isNewDayDialogOpen = true` para renderizar o diálogo da nova notificação de dia.

### src/components/session/

#### [NEW] [NewDayDialog.tsx](file:///Users/take5dev1/projects/rpg-biblico/src/components/session/NewDayDialog.tsx)
- Diálogo (Modal) disparado quando um novo dia começa.
- Irá exibir uma notificação: "Um novo dia raiou. Lembre-se de usar sua ficha de personagem para recarregar suas habilidades diárias (Descanso Longo/Curto)."
- Terá um botão "Entendi" para fechar.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Sem Magia Arcana)**: PASS
- **Principle II (Sem Itens Mágicos)**: PASS
- **Principle III (Sistema de Fé como Núcleo)**: PASS
- **Principle VI (Documentação)**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/020-session-time-control/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
```

### Source Code

```text
src/
├── components/
│   └── session/
│       └── NewDayDialog.tsx
└── pages/
    └── session/
        └── ActiveSessionPage.tsx
```

## Verification Plan

### Automated Tests
- N/A

### Manual Verification
1. Criar as colunas no Supabase para testar o backend (ou fazer via query).
2. Abrir a visão de mestre. Observar que no cabeçalho aparecerá "DIA 1" e "Manhã".
3. Abrir a visão de jogador (outra aba).
4. Na visão do mestre, clicar no botão para avançar o tempo. Verificar que o badge muda para "Tarde" em tempo real em ambas as abas.
5. Avançar de "Noite" para "Manhã". Verificar se o dia vira "DIA 2".
6. Verificar se o pop-up de Novo Dia é exibido corretamente na tela.
