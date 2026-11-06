// O que o Template Endemoniado (docs/bestiario/template-endemoniado.md) acrescenta ao inimigo. O
// motor (src/domain/enemyTemplate.ts) aplica os números; aqui ficam os textos e as Habilidades.
// O Grito Atormentador vem da biblioteca de Habilidades de inimigo (CD 12, definida pelo autor).
import type { EnemyPresetDefinition } from './schemas';

export const ENDEMONIADO_ALIGNMENT = 'Caótico e Mau';
export const ENDEMONIADO_SKILL = 'Intimidação';
export const ENDEMONIADO_IMMUNITIES = ['amedrontado'];
/** O limite de INT do Endemoniado: puramente instintivo. */
export const ENDEMONIADO_INT_CAP = 6;
/** O que FOR e CON ganham (+2 nos modificadores). */
export const ENDEMONIADO_ATTRIBUTE_BONUS = 4;

export const ENDEMONIADO_ABILITIES: EnemyPresetDefinition['abilities'] = [
  {
    name: 'Fúria Desumana',
    description:
      'O endemoniado ignora dores mortais. Quando cair a 0 PV, faz um Teste de Constituição (CD 10). Se passar, sobrevive com 1 PV. O CD aumenta em 5 a cada uso.',
  },
  {
    name: 'Vulnerabilidade Espiritual',
    description:
      'Vulnerável a ataques ou rituais baseados no Sistema de Fé, como as orações exorcistas de Sacerdotes.',
  },
  {
    name: 'Grito Atormentador (Recarga 5-6)',
    description:
      'Quem ouvir a até 9 m faz um TR de Sabedoria CD 12 ou perde 1d4 de Fé e sofre Desvantagem na próxima jogada de ataque.',
    libraryId: 'enemy-grito-atormentador',
  },
];

/** O Ataque Bestial: as mãos nuas, 1d6 + FOR perfurante. O bônus de acerto e de dano vêm da FOR. */
export const ENDEMONIADO_BESTIAL_ATTACK = {
  name: 'Ataque Bestial (Garras/Mordida)',
  mode: 'melee' as const,
  attribute: 'for' as const,
  reach: '1,5m',
  damageDice: '1d6',
  damageType: 'perfurante',
};
