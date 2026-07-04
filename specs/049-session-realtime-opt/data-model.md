# Phase 1: Data Model

Nenhuma nova tabela no banco de dados será criada, pois o chat é estritamente efêmero (Supabase Broadcast). As definições de modelo abaixo referem-se aos tipos TypeScript usados para parsear as mensagens do canal Broadcast.

## Entidades e Tipos (TypeScript)

### SessionMessage

Interface para os eventos de chat (OOC e Log Mecânico) enviados via Broadcast.

```typescript
type MessageType = 'text' | 'dice_roll' | 'system';

interface SessionMessage {
  id: string; // UUID gerado no client-side para key do React
  sessionId: string;
  senderId: string; // auth.user.id
  senderName: string;
  type: MessageType;
  content: string; // Texto digitado, ou stringificação do resultado do dado
  timestamp: string; // ISO date string no momento do envio
  metadata?: any; // Informações adicionais caso seja 'dice_roll', como modificadores e dano
}
```

### BroadcastEvent

Interface para indicadores UI rápidos (ex: "Digitando...").

```typescript
type BroadcastEventType = 'typing' | 'rolling_dice';

interface BroadcastEvent {
  sessionId: string;
  senderId: string;
  senderName: string;
  eventType: BroadcastEventType;
  isActive: boolean; // Indica se começou ou terminou de digitar/rolar
}
```

## Regras de Validação

- Mensagens Broadcast têm tamanho máximo estabelecido pelo Supabase (limite típico de 1MB por payload, mas neste caso será ínfimo, algumas centenas de bytes).
- A interface `SessionMessage` deverá ser injetada no state array `messages` do React via `useSessionChat`.
