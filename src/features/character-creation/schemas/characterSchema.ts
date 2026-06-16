import { z } from 'zod';

export const nameSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.').max(50, 'O nome não pode exceder 50 caracteres.'),
});

export const tribeSchema = z.object({
  tribe: z.string().min(1, 'Selecione uma tribo.'),
});

export const vocationSchema = z.object({
  vocation: z.string().min(1, 'Selecione uma vocação.'),
}).refine((data) => data.vocation !== '', {
  message: 'Vocação é obrigatória.',
});

export const attributesSchema = z.object({
  attributes: z.object({
    for: z.number().min(3).max(18),
    des: z.number().min(3).max(18),
    con: z.number().min(3).max(18),
    int: z.number().min(3).max(18),
    sab: z.number().min(3).max(18),
    car: z.number().min(3).max(18),
  })
});

export const faithAspectsSchema = z.object({
  fortress: z.string().min(1, 'Selecione uma Fortaleza.'),
  temptation: z.string().min(1, 'Selecione uma Tentação.'),
});

export const equipmentSchema = z.object({
  coins: z.number().min(0, 'Você não pode ficar com moedas negativas.'),
  equipment: z.array(z.any()), // Can be refined later
});

export const narrativeSchema = z.object({
  narrative: z.object({
    imageUrl: z.string().optional(),
    physicalDesc: z.string().optional(),
    history: z.string().optional(),
    personality: z.string().optional(),
  })
});

// Final payload validation schema
export const characterSchema = z.object({
  ...nameSchema.shape,
  ...tribeSchema.shape,
  ...vocationSchema.shape,
  ...attributesSchema.shape,
  ...faithAspectsSchema.shape,
  ...equipmentSchema.shape,
  ...narrativeSchema.shape,
}).refine(data => {
  if (data.tribe === 'Levi' && !['Sacerdote', 'Sábio'].includes(data.vocation)) {
    return false;
  }
  return true;
}, {
  message: "A Regra de Levi exige que a vocação seja Sacerdote ou Sábio.",
  path: ["vocation"]
});
