// CARACTERIZAÇÃO: a lista de quem pode entrar num combate. A tela que a usa é testada em
// pages/session/ActiveSessionPage.test.tsx.
import { describe, expect, it } from 'vitest';
import type { SessionCharacter, SessionNpc, SessionPlayer } from '@/data-access/sessions';
import { buildCombatEntities } from './combatEntities';

const fake = <T>(value: object) => value as T;
const player = (id: string, over: object = {}) =>
  fake<SessionPlayer>({
    user_id: `u-${id}`,
    character: {
      id,
      name: `Jogador ${id}`,
      stats: { pv: 10, current_pv: 7, ca: 12 },
      is_deleted: false,
      is_npc: false,
      is_enemy: false,
      ...over,
    },
  });

describe('buildCombatEntities', () => {
  it('lista jogadores, depois NPCs jogáveis, depois inimigos, com tipo e PV atual', () => {
    const entities = buildCombatEntities({
      playerCharacters: [player('p1')],
      npcs: [
        fake<SessionNpc>({ id: 'n1', name: 'Guarda', is_playable: true, stats: { pv: 8 } }),
        fake<SessionNpc>({ id: 'n2', name: 'Mercador', is_playable: false, stats: { pv: 5 } }),
      ],
      enemies: [fake<SessionCharacter>({ id: 'e1', name: 'Filisteu', stats: { pv: 12 } })],
    });
    expect(entities.map((e) => [e.type, e.id, e.name, e.hpCurrent])).toEqual([
      ['player', 'p1', 'Jogador p1', 7],
      ['npc', 'n1', 'Guarda', 8],
      ['enemy', 'e1', 'Filisteu', 12],
    ]);
  });

  it('deixa de fora excluídos, NPC simples e fichas marcadas como NPC ou inimigo entre os jogadores', () => {
    const entities = buildCombatEntities({
      playerCharacters: [
        player('ok'),
        player('npc', { is_npc: true }),
        player('inimigo', { is_enemy: true }),
        player('excluido', { is_deleted: true }),
      ],
      npcs: [fake<SessionNpc>({ id: 'n1', is_playable: true, is_deleted: true, stats: {} })],
      enemies: [fake<SessionCharacter>({ id: 'e1', is_deleted: true, stats: {} })],
    });
    expect(entities.map((e) => e.id)).toEqual(['ok']);
  });

  it('nome vazio cai em Jogador, NPC e Inimigo', () => {
    const entities = buildCombatEntities({
      playerCharacters: [player('p1', { name: '' })],
      npcs: [fake<SessionNpc>({ id: 'n1', name: '', is_playable: true, stats: { pv: 1 } })],
      enemies: [fake<SessionCharacter>({ id: 'e1', name: '', stats: { pv: 1 } })],
    });
    expect(entities.map((e) => e.name)).toEqual(['Jogador', 'NPC', 'Inimigo']);
  });

  it('cada entidade traz a CA e as resistências calculadas da ficha', () => {
    const [entity] = buildCombatEntities({
      playerCharacters: [player('p1')],
      npcs: [],
      enemies: [],
    });
    // Sem armadura equipada, a CA é a da ficha.
    expect(entity).toMatchObject({ totalAc: 12, baseAc: 12, bonusAc: 0, resistances: [] });
  });
});
