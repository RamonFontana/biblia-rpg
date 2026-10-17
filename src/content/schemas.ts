// Esquemas do conteúdo do jogo. Os tipos saem daqui (z.infer), então esquema e tipo não divergem.
// O gate de dados (src/content/gameData.test.ts) valida cada entrada contra estes esquemas.
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

export const abilitySchema = z.strictObject({
  id: z.string().regex(/^(tribe|vocation)-[a-z0-9-]+$/),
  name: z.string().min(1),
  sourceType: z.enum(['tribe', 'vocation']),
  sourceId: z.string().regex(/^[a-z]+$/),
  minLevel: z.number().int().min(1).max(20),
  path: z.enum(['A', 'B']).optional(),
  actionType: z.enum(['passive', 'action', 'bonus_action', 'reaction', 'free_action']),
  usageType: z.enum([
    'unlimited',
    'short_rest',
    'long_rest',
    'combat',
    'week',
    'campaign',
    'faith_cost',
  ]),
  maxUses: z.number().int().min(1).max(10).optional(),
  faithCost: z.number().int().min(1).max(100).optional(),
  effect: z.string().min(1),
  applyConditions: z
    .array(
      z.strictObject({
        conditionId: z.string().min(1),
        duration: z.number().int().min(1).optional(),
      }),
    )
    .optional(),
});

export type AbilityDefinition = z.infer<typeof abilitySchema>;
