// Inimigos prontos do formulário (base do bestiário). As Habilidades com `libraryId` trazem o efeito
// da biblioteca de Habilidades de inimigo.

import type { EnemyFormValues } from './schema';

interface BestiaryPreset {
  id: string;
  name: string;
  max_hp: number;
  ca: number;
  desc: string;
  attributes: NonNullable<EnemyFormValues['attributes']>;
  vocation: string;
  skills: NonNullable<EnemyFormValues['skills']>;
}

export const MOCK_BESTIARY: BestiaryPreset[] = [
  {
    id: 'bandido-deserto',
    name: 'Bandido do Deserto',
    max_hp: 11,
    ca: 11,
    desc: 'Salteadores de beira de estrada com ataque furtivo e funda.',
    attributes: { for: 10, des: 14, con: 12, int: 10, sab: 10, car: 10 },
    vocation: 'Ladrão',
    skills: [
      { name: 'Ataque Furtivo', description: 'Causa dano extra se o alvo estiver distraído' },
    ],
  },
  {
    id: 'soldado-filisteu',
    name: 'Soldado Filisteu',
    max_hp: 16,
    ca: 16,
    desc: 'Soldados bem treinados com cota de escamas e formação em parede.',
    attributes: { for: 15, des: 12, con: 14, int: 10, sab: 10, car: 10 },
    vocation: 'Guerreiro',
    skills: [
      {
        name: 'Ataque Poderoso',
        description: 'Pode reduzir a chance de acerto para aumentar o dano',
      },
    ],
  },
  {
    id: 'general-guerra',
    name: 'General de Guerra',
    max_hp: 52,
    ca: 18,
    desc: 'Líder tático que pode comandar aliados a atacar com reação.',
    attributes: { for: 16, des: 14, con: 16, int: 14, sab: 12, car: 16 },
    vocation: 'Guerreiro',
    skills: [{ name: 'Comando', description: 'Aliados próximos ganham bônus no ataque' }],
  },
  {
    id: 'leao-judeia',
    name: 'Leão da Judeia',
    max_hp: 26,
    ca: 13,
    desc: 'Fera com tática de matilha, salto e bote.',
    attributes: { for: 16, des: 15, con: 14, int: 3, sab: 12, car: 8 },
    vocation: 'Fera',
    skills: [
      {
        name: 'Salto e Bote',
        description: 'Se mover antes de atacar e acertar, pode derrubar o alvo',
        libraryId: 'enemy-salto-e-bote',
      },
    ],
  },
];
