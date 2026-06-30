# Implementation Plan: Efeitos e Condições (042-effects-conditions)

**Branch**: `042-effects-conditions` | **Date**: 2026-06-30 | **Spec**: [spec.md](file:///Users/take5dev1/projects/rpg-biblico/specs/042-effects-conditions/spec.md)

**Input**: Feature specification from `specs/042-effects-conditions/spec.md`

## Summary

Implementar a infraestrutura (dados) e a interface (UI) para suportar a aplicação, persistência e visualização de Efeitos e Condições (ex: Sangrando, Atordoado, Cego). A interface utilizará componentes **shadcn/ui** (Badges, Dropdowns, Dialogs). Adicionalmente, implementaremos assinaturas **Supabase Real-time** para garantir que todos os jogadores vejam imediatamente quando o Mestre aplicar ou remover uma condição.

## User Review Required

> [!IMPORTANT]
> **Automação de Real-time e Supabase**
> Para que o recurso "real-time" funcione, as tabelas `characters` e `combat_participants` precisam estar com o **Realtime ativado** no painel do Supabase. Vou verificar e instruir como ativar se não estiver, usando o MCP do Supabase.

> [!NOTE]
> **Componentes Shadcn**
> Utilizarei os componentes `Badge` para exibição na ficha e `DropdownMenu` / `Command` para o Mestre selecionar condições. Instalarei o que faltar através do `npx shadcn@latest add ...`

## Open Questions

> [!WARNING]
> No momento, não há questões em aberto bloqueantes. As ambiguidades da spec já foram resolvidas. A sincronização visual em tempo real vai necessitar de que os hooks do React (`react-query` ou `zustand`) se inscrevam nos canais do Supabase.

## Proposed Changes

### Banco de Dados & Supabase Real-time
- **[MODIFY]** Garantir que as tabelas `characters` e `combat_participants` tenham a estrutura JSON esperada: `[{ "conditionId": "string", "duration": "number" }]`.
- **[MODIFY]** Habilitar Supabase Real-time broadcast para as tabelas `characters` e `combat_participants` (Instruções ou via SQL).

---

### Componentes de Interface (UI) e shadcn
#### [NEW] `src/components/ui/badge.tsx` (se não existir)
- Instalação via CLI do shadcn para renderizar as tags de condições de forma visualmente rica.
#### [NEW] `src/components/ui/dropdown-menu.tsx` (se não existir)
- Para o menu de seleção de condições do Mestre.
#### [NEW] `src/components/conditions/ConditionBadge.tsx`
- Componente especializado que mapeia o `conditionId` para uma cor e ícone específicos (ex: Sangrando = Vermelho, Envenenado = Verde).
#### [NEW] `src/components/conditions/ConditionSelector.tsx`
- Interface para o Mestre adicionar condições manualmente. Inclui o input para definir a `duration`.

---

### Lógica de Estado e Sincronização
#### [MODIFY] `src/stores/useCombatStore.ts` (ou similar)
- Adicionar listener do Supabase Real-time (`.channel('schema-db-changes')`) para atualizar a store quando um `UPDATE` ocorrer em `combat_participants`.
#### [MODIFY] `src/stores/useCharacterStore.ts` (ou similar)
- Adicionar listener real-time para a tabela `characters` para atualizar a UI do jogador passivamente fora de combate.
#### [NEW] `src/services/conditionsService.ts`
- Funções para adicionar e remover condições (trata a lógica de **Sobrescrita** escolhida na spec) e funções de sincronização (Combate <-> Ficha Global).

## Verification Plan

### Automated / Manual Verification
- **Verificação de UI**: Renderizar diferentes condições simultâneas no front-end para garantir que o layout dos `Badges` não quebra (wrap correto).
- **Verificação de Real-time**: Abrir duas abas. O Mestre aplica uma condição em uma aba; o jogador na outra aba deve ver o `ConditionBadge` aparecer instantaneamente sem refresh (via Websockets do Supabase).
- **Verificação de Sobrescrita**: Tentar aplicar "Sangrando" em um alvo que já está sangrando. Verificar no Supabase se o array JSON apenas atualizou a `duration`, em vez de duplicar o registro.
- **Sincronização de Combate**: Adicionar personagem ao combate -> aplicar condição temporária e permanente -> encerrar combate -> verificar se apenas a permanente voltou para a ficha global.
