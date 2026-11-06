import { z } from 'zod';
import { enemyAbilityEffectSchema, enemyAttackSchema } from '@/content/schemas';

/** O ataque no formulário: dado e texto extra podem ficar em branco (a normalização os tira). */
const formAttackSchema = enemyAttackSchema.extend({
  damage: z.strictObject({
    dice: z.union([z.literal(''), z.string().regex(/^\d+d\d+$/, 'Use o formato 1d6')]).optional(),
    bonus: z.number().int().min(-5).max(20),
  }),
  extra: z.string().optional(),
});

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
  /** Quantas cópias criar de uma vez (1 a 8); não faz parte da ficha. */
  quantity: z
    .number({ error: 'Informe a quantidade, de 1 a 8' })
    .int('A quantidade deve ser um número inteiro')
    .min(1, 'A quantidade mínima é 1')
    .max(8, 'A quantidade máxima é 8')
    .optional(),
  /** O Preset de origem (ADR 0012): só o rótulo, o inimigo é uma cópia independente. */
  presetId: z.string().optional(),
  attacks: z.array(formAttackSchema).optional(),
  /** Deslocamento, perícias, sentidos e ND: consulta em texto, não entra no motor. */
  details: z
    .object({
      speed: z.string().optional(),
      proficiencies: z.string().optional(),
      senses: z.string().optional(),
      challenge: z.string().optional(),
    })
    .optional(),
  conditionImmunities: z.array(z.string()).optional(),
  saveBonuses: z
    .partialRecord(z.enum(['for', 'des', 'con', 'int', 'sab', 'car']), z.number().optional())
    .optional(),
});

export type EnemyFormValues = z.infer<typeof enemyFormSchema>;

/**
 * Tira do formulário o que ficou em branco: sem ataque, detalhe, imunidade ou bônus de TR o inimigo
 * sai sem bloco (do zero, como antes), em vez de gravar objetos vazios.
 */
export function normalizeEnemyForm(values: EnemyFormValues): EnemyFormValues {
  const attacks = (values.attacks ?? []).map((attack) => ({
    ...attack,
    damage: { ...attack.damage, dice: attack.damage.dice || undefined },
    extra: attack.extra?.trim() || undefined,
  }));

  const details = Object.fromEntries(
    Object.entries(values.details ?? {})
      .map(([key, value]) => [key, value?.trim()])
      .filter(([, value]) => value),
  ) as NonNullable<EnemyFormValues['details']>;

  const saveBonuses = Object.fromEntries(
    Object.entries(values.saveBonuses ?? {}).filter(([, value]) => Number.isFinite(value)),
  ) as NonNullable<EnemyFormValues['saveBonuses']>;

  return {
    ...values,
    attacks: attacks.length > 0 ? attacks : undefined,
    details: Object.keys(details).length > 0 ? details : undefined,
    conditionImmunities: values.conditionImmunities?.length
      ? values.conditionImmunities
      : undefined,
    saveBonuses: Object.keys(saveBonuses).length > 0 ? saveBonuses : undefined,
  };
}
