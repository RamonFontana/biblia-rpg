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
  /** FOR mínima para usar sem aviso (a Lorica pede 13). Equipar abaixo disso é permitido. */
  requiresStrength: z.number().int().min(1).max(30).optional(),
  statPenalty: z
    .strictObject({ stat: z.string().min(1), value: z.number(), type: z.string().min(1) })
    .optional(),
});

export type ContentItem = z.infer<typeof itemSchema>;

/**
 * O efeito de combate de uma Habilidade (Onda 5, feature 4): quem recebe e as Condições aplicadas,
 * com a duração em rodadas (sem duração, a Condição fica até ser removida). O texto livre
 * (`effect`) continua: cura, dano e bônus seguem como texto, aplicados pelo Mestre.
 */
export const abilityEffectSchema = z
  .strictObject({
    targets: z.enum(['enemy', 'enemies', 'ally', 'allies', 'aggressor']),
    /** O TR do alvo (atributo): a Condição só entra em quem falha. Sem TR, entra em todos. */
    save: z
      .strictObject({ attribute: z.enum(['for', 'des', 'con', 'int', 'sab', 'car']) })
      .optional(),
    apply: z
      .array(
        z.strictObject({
          conditionId: z.string().min(1),
          rounds: z.number().int().min(1).max(100).optional(),
        }),
      )
      .min(1)
      .optional(),
    /**
     * A Condição que a Habilidade tira dos alvos (aliados, sem TR): `fixed` tira a Condição citada,
     * `choice` deixa o jogador escolher uma da lista e `per_target` deixa escolher uma de cada alvo,
     * entre as que ele tem.
     */
    remove: z
      .discriminatedUnion('mode', [
        z.strictObject({
          mode: z.literal('fixed'),
          conditionIds: z.array(z.string().min(1)).length(1),
        }),
        z.strictObject({
          mode: z.literal('choice'),
          conditionIds: z.array(z.string().min(1)).min(2),
        }),
        z.strictObject({ mode: z.literal('per_target') }),
      ])
      .optional(),
  })
  .refine((effect) => effect.apply !== undefined || effect.remove !== undefined, {
    message: 'O efeito precisa aplicar ou remover uma Condição',
  });

/**
 * O efeito de uma Habilidade de inimigo (Onda 5, feature 4): o TR que os personagens fazem (atributo
 * e CD fixa), as Condições de quem falhar, a Fé que perdem (1d4 ou 1d6, o Mestre rola) e o uso.
 * `recharge` volta com 5 ou 6 num d6 no início do turno do inimigo (CONTEXT.md, Recarga).
 */
export const enemyAbilityEffectSchema = z
  .strictObject({
    save: z
      .strictObject({
        attribute: z.enum(['for', 'des', 'con', 'int', 'sab', 'car']),
        cd: z.number().int().min(1).max(40),
      })
      .optional(),
    apply: z
      .array(
        z.strictObject({
          conditionId: z.string().min(1),
          rounds: z.number().int().min(1).max(100).optional(),
        }),
      )
      .min(1)
      .optional(),
    faithLoss: z.strictObject({ sides: z.union([z.literal(4), z.literal(6)]) }).optional(),
    usage: z.enum(['unlimited', 'per_combat', 'recharge']),
    /** O lembrete de um efeito que o app não aplica (a Desvantagem no próximo ataque). */
    reminder: z.string().min(1).optional(),
  })
  .refine((effect) => effect.apply !== undefined || effect.faithLoss !== undefined, {
    message: 'O efeito precisa aplicar uma Condição ou tirar Fé',
  });

export const enemyAbilitySchema = z.strictObject({
  id: z.string().regex(/^enemy-[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string().min(1),
  effect: enemyAbilityEffectSchema,
});

export type EnemyAbilityEffect = z.infer<typeof enemyAbilityEffectSchema>;
export type EnemyAbilityDefinition = z.infer<typeof enemyAbilitySchema>;

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
  combatEffect: abilityEffectSchema.optional(),
});

export type AbilityEffect = z.infer<typeof abilityEffectSchema>;
export type AbilityDefinition = z.infer<typeof abilitySchema>;

/** Kit inicial de uma Vocação: o texto da criação de personagem e os itens que o personagem recebe. */
export const kitSchema = z.strictObject({
  name: z.string().min(1),
  cost: z.number().int().min(0),
  leftover: z.number().int().min(0),
  markdown: z.string().min(1),
  /** Itens do kit pelo slug do catálogo (src/content/items.ts). */
  items: z
    .array(
      z.strictObject({
        slug: z.string().regex(/^[a-z_]+$/),
        quantity: z.number().int().min(1).optional(),
      }),
    )
    .min(1),
});

export type Kit = z.infer<typeof kitSchema>;
