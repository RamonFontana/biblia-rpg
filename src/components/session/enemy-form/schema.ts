import { z } from 'zod';

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
  skills: z.array(z.object({
    name: z.string().min(1, 'Nome da habilidade é obrigatório'),
    description: z.string()
  })).optional(),
  imageBase64: z.string().optional()
});

export type EnemyFormValues = z.infer<typeof enemyFormSchema>;
