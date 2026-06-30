# Data Model: Efeitos e Condições

## Entidades

### `characters`
A tabela global dos personagens no Supabase.
- **Campos adicionados/modificados**:
  - `conditions` (JSONB): Lista de objetos do tipo `ConditionEntry`. Utilizado para persistir estados e efeitos na ficha principal, visível fora de combate.

### `combat_participants`
A tabela que controla o combate ativo.
- **Campos já existentes/modificados**:
  - `conditions` (JSONB): Lista de objetos `ConditionEntry`. Substitui/Complementa o valor das `characters` durante o combate. Permite efeitos temporários que são expirados antes do encerramento da batalha.

## Tipos e Contratos (Typescript)

```typescript
// src/types/combat.ts (ou similar)
export interface ConditionEntry {
  conditionId: string; // Ex: 'sangrando', 'envenenado'
  duration: number; // Em turnos. Fora de combate, tratado narrativamente.
  // sourceId?: string; (Opcional, de quem causou)
}
```

## Regras de Estado
1. **Application (Sobrescrita)**: Ao aplicar um novo estado cujo `conditionId` já exista, ele não é adicionado novamente ao array; apenas o objeto existente tem seu valor de `duration` atualizado.
2. **Transferência Global -> Combate**: Quando o Mestre chama a função de adicionar o jogador ao combate, a store copia o array `conditions` do Character para o CombatParticipant correspondente.
3. **Limpeza**: Ao finalizar o combate, condições com durações muito curtas/estritamente de combate são removidas, e as demais voltam para a tabela `characters`.
