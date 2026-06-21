import { z } from "zod";

// 1. Setup do Combate (Mestre)
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

// 2. Aplicação de Dano ou Cura (Mestre)
export const HealthModificationSchema = z.object({
  amount: z.number().int("Deve ser um número inteiro").positive("O valor deve ser maior que zero"),
  type: z.enum(["damage", "healing"]),
  participantId: z.string().uuid()
});

export type HealthModificationFormValues = z.infer<typeof HealthModificationSchema>;

// 3. Resolução Híbrida de Rolagem (Jogador)
export const PhysicalRollSchema = z.object({
  attackRoll: z.number().int().min(1, "O dado deve ser no mínimo 1").max(30, "Valor irreal para um d20 + mod"),
  damageRoll: z.number().int().min(0, "O dano não pode ser negativo").optional()
});

export type PhysicalRollFormValues = z.infer<typeof PhysicalRollSchema>;

// 4. Equipamentos e Inventário
export interface CharacterEquipment {
  head: string | null;      // character_item_id
  body: string | null;      // character_item_id
  mainHand: string | null;  // character_item_id
  offHand: string | null;   // character_item_id
}

export interface ItemEffects {
  slot?: 'head' | 'body' | '1h' | '2h' | 'shield';
  acBonus?: number;       // For armor and shields
  damageDie?: string;     // e.g. "1d8", "1d6"
  damageType?: string;    // e.g. "cortante", "perfurante"
  properties?: string[];  // e.g. ["Versátil", "Acuidade"]
  stealthDisadvantage?: boolean;
}
