# Zod Form Validation Contracts

Os formulários que utilizam `react-hook-form` estarão atrelados aos seguintes contratos (schemas) utilizando a biblioteca `zod`.

## 1. Setup do Combate (Mestre)

Validação para o formulário de inicialização do combate, onde o mestre insere a iniciativa dos participantes selecionados.

```typescript
import { z } from "zod";

export const CombatSetupSchema = z.object({
  participants: z.array(
    z.object({
      entityId: z.string().uuid("ID inválido"),
      entityType: z.enum(["player", "npc", "enemy"]),
      initiative: z.number().int("A iniciativa deve ser um número inteiro").min(0, "A iniciativa não pode ser negativa"),
      hpCurrent: z.number().int().min(0)
    })
  ).min(2, "É necessário pelo menos dois participantes para iniciar um combate")
});

export type CombatSetupFormValues = z.infer<typeof CombatSetupSchema>;
```

## 2. Aplicação de Dano ou Cura (Mestre)

Validação para o modal onde o mestre modifica a vida atual de um participante.

```typescript
import { z } from "zod";

export const HealthModificationSchema = z.object({
  amount: z.number().int("Deve ser um número inteiro").positive("O valor deve ser maior que zero"),
  type: z.enum(["damage", "healing"]),
  participantId: z.string().uuid()
});

export type HealthModificationFormValues = z.infer<typeof HealthModificationSchema>;
```

## 3. Resolução Híbrida de Rolagem (Jogador)

Validação para o registro de uma ação física rolada na mesa.

```typescript
import { z } from "zod";

export const PhysicalRollSchema = z.object({
  attackRoll: z.number().int().min(1, "O dado deve ser no mínimo 1").max(30, "Valor irreal para um d20 + mod"),
  damageRoll: z.number().int().min(0, "O dano não pode ser negativo").optional()
});

export type PhysicalRollFormValues = z.infer<typeof PhysicalRollSchema>;
```
