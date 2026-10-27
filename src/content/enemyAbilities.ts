// Biblioteca de Habilidades de inimigo do bestiário (docs/bestiario/), com o efeito que o app
// aplica. O dano (3d6 psíquico, 2d4 de veneno) fica com o Mestre, em "Modificar Vida". O `id` é a
// referência gravada na ficha do inimigo: nunca o renomeie.
import type { EnemyAbilityDefinition } from './schemas';

export const ENEMY_ABILITIES: EnemyAbilityDefinition[] = [
  {
    id: 'enemy-presenca-aterradora',
    name: 'Presença Aterradora',
    description:
      'Criatura hostil a até 9 m que veja o Anakim faz um TR de Sabedoria CD 13 ou fica Amedrontada por 1 minuto.',
    effect: {
      save: { attribute: 'sab', cd: 13 },
      apply: [{ conditionId: 'amedrontado', rounds: 10 }],
      usage: 'unlimited',
    },
  },
  {
    id: 'enemy-grito-atormentador',
    name: 'Grito Atormentador (Recarga 5-6)',
    description:
      'Quem ouvir a até 9 m faz um TR de Sabedoria CD 12 ou perde 1d4 de Fé e sofre Desvantagem na próxima jogada de ataque.',
    effect: {
      save: { attribute: 'sab', cd: 12 },
      faithLoss: { sides: 4 },
      usage: 'recharge',
      reminder: 'Desvantagem na próxima jogada de ataque de quem falhou.',
    },
  },
  {
    id: 'enemy-maldicao-de-baal',
    name: 'Maldição de Baal (Recarga 5-6)',
    description:
      'Um alvo a até 18 m faz um TR de Sabedoria CD 13 ou perde 1d6 de Fé. O dano psíquico (3d6, metade no sucesso) fica com o Mestre.',
    effect: {
      save: { attribute: 'sab', cd: 13 },
      faithLoss: { sides: 6 },
      usage: 'recharge',
    },
  },
  {
    id: 'enemy-salto-e-bote',
    name: 'Salto e Bote',
    description:
      'Depois de se mover 6 m em linha reta e acertar uma garra, o alvo faz um TR de Força CD 13 ou fica Caído.',
    effect: {
      save: { attribute: 'for', cd: 13 },
      apply: [{ conditionId: 'caido' }],
      usage: 'unlimited',
    },
  },
];

/** A Habilidade da biblioteca pelo id; id desconhecido ou ausente não acha nada. */
export function findEnemyAbility(
  id: string | null | undefined,
): EnemyAbilityDefinition | undefined {
  return ENEMY_ABILITIES.find((a) => a.id === id);
}
