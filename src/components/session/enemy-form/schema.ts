import { z } from 'zod';
import { enemyAbilityEffectSchema, enemyAttackSchema } from '@/content/schemas';

export const enemyFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  vocation: z.string().optional(),
  hpMax: z.number().min(1, 'O HP máximo deve ser pelo menos 1'),
  hpCurrent: z.number().min(0, 'O HP atual não pode ser negativo'),
  ca: z.number().min(0, 'A CA não pode ser negativa'),
  attributes: z.object({
    for: z.number().min(0),
    des: z.number().min(0),
    con: z.number().min(0),
    int: z.number().min(0),
    sab: z.number().min(0),
    car: z.number().min(0),
  }),
  skills: z
    .array(
      z.object({
        name: z.string().min(1, 'Nome da habilidade é obrigatório'),
        description: z.string(),
        /** A Habilidade da biblioteca do bestiário (o efeito vem de lá). */
        libraryId: z.string().optional(),
        /** O efeito de uma Habilidade personalizada. */
        effect: enemyAbilityEffectSchema.optional(),
      }),
    )
    .optional(),
  imageBase64: z.string().optional(),
  /** O Preset de origem (ADR 0012): só o rótulo, o inimigo é uma cópia independente. */
  presetId: z.string().optional(),
  attacks: z.array(enemyAttackSchema).optional(),
  /** Deslocamento, perícias, sentidos e ND: consulta em texto, não entra no motor. */
  details: z
    .object({
      speed: z.string(),
      proficiencies: z.string().optional(),
      senses: z.string(),
      challenge: z.string(),
    })
    .optional(),
  conditionImmunities: z.array(z.string()).optional(),
  saveBonuses: z
    .partialRecord(z.enum(['for', 'des', 'con', 'int', 'sab', 'car']), z.number())
    .optional(),
});

export type EnemyFormValues = z.infer<typeof enemyFormSchema>;
