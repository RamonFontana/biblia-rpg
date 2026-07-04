# Quickstart: Otimização de Realtime da Sessão

## Overview

Este guia serve como introdução rápida para a nova arquitetura do Realtime nas sessões de RPG e uso do Chat.

### O que mudou?

Ao invés de carregar o array inteiro de Personagens a partir do banco de dados a cada modificação, a UI agora se atualiza otimisticamente (e em tempo real) fazendo merge do payload `UPDATE` na store local. O mesmo se aplica a `trades` e `tests`.

Para os recursos de Chat OOC (Out of Character) e logs de dados rolados, o app passou a usar **Supabase Broadcast**. Estas mensagens são completamente efêmeras: elas fluem diretamente de cliente para cliente sem passar pelo banco de dados (armazenamento persistente). O histórico existe apenas enquanto a sessão estiver aberta no navegador e será zerado em qualquer refresh de página.

## Core Concepts

1. **Local State Mutation**: Atualização na tela com base no evento `postgres_changes`.
2. **Ephemeral Broadcast**: Comunicação assíncrona, não persistente, de baixo payload.

## Main Entry Points

- `useSessionCharacters.ts`: Escuta a tabela `characters` e muta os dados do state.
- `useSessionChat.ts`: Inicializa o hook responsável por enviar e receber o histórico efêmero da sessão ativa, inscrevendo-se em eventos de 'chat' e 'presence' no canal `session:ID`.

## Usage Examples

Para enviar uma mensagem no Chat:

```typescript
const { sendMessage } = useSessionChat(sessionId, user);

// Usado no submit do form
const handleSend = () => {
    sendMessage("Olá a todos!", "text");
};
```

Para enviar aviso efêmero (UI Feedback):

```typescript
const { sendTypingIndicator } = useSessionChat(sessionId, user);

// No onChange do input
sendTypingIndicator(true);
```
