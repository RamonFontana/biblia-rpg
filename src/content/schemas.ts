// Esquemas do conteúdo do jogo. Os tipos saem daqui (z.infer), então esquema e tipo não divergem.
// O gate de dados (src/data/gameData.test.ts) valida cada entrada contra estes esquemas.
import { z } from 'zod';

export const conditionSchema = z.strictObject({
  id: z.string().regex(/^[a-z_]+$/),
  name: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().optional(), // classe do Tailwind ou hex
});

export type ConditionDefinition = z.infer<typeof conditionSchema>;

export const itemCategorySchema = z.enum([
  'Simples',
  'Marcial',
  'Leve',
  'Média',
  'Pesada',
  'Escudo',
  'Sagrada',
  'Todas',
]);

export type ItemCategory = z.infer<typeof itemCategorySchema>;

/** `id` é o slug gravado em `items.slug` (ADR 0003): nunca renomeie um item já em uso. */
export const itemSchema = z.strictObject({
  id: z.string().regex(/^[a-z_]+$/),
  name: z.string().min(1),
  type: z.enum(['Armadura', 'Escudo', 'Arma', 'Consumível', 'Utilidade']),
  category: itemCategorySchema,
  description: z.string().min(1),
  cost: z.number().min(0).max(1000),
  armorClass: z.number().int().min(0).max(30).optional(),
  damage: z
    .string()
    .regex(/^\d+d\d+ \S+$/)
    .optional(),
  level: z.number().int().min(1).max(5).optional(),
  slot: z.enum(['body', 'head', 'offHand', 'mainHand']).optional(),
  properties: z.array(z.string().min(1)).optional(),
  conditionResistances: z.array(z.string().min(1)).optional(),
  statPenalty: z
    .strictObject({ stat: z.string().min(1), value: z.number(), type: z.string().min(1) })
    .optional(),
});

export type ContentItem = z.infer<typeof itemSchema>;
