// Quem aparece como Retrato no Palco do jogador e com que PV e Condições. Termos: CONTEXT.md
// (Palco, Retrato).
import { describe, expect, it } from 'vitest';
import { buildRetratos, hiddenEntityIds } from './retratos';

const ch = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  name: `Personagem ${id}`,
  stats: { pv: 12, current_pv: 9 },
  conditions: [],
  is_deleted: false,
  is_npc: false,
  is_enemy: false,
  is_dead: false,
  ...over,
});
const player = (userId: string, id: string, over: Record<string, unknown> = {}) => ({
  user_id: userId,
  character: ch(id, over),
});

const base = {
  playerCharacters: [player('u1', 'c1'), player('u2', 'c2')],
  npcs: [] as never[],
  enemies: [] as never[],
  myCharacterId: 'c1',
  hasActiveCombat: false,
  participants: [] as never[],
};
const build = (over: Record<string, unknown> = {}) => buildRetratos({ ...base, ...over } as never);

describe('buildRetratos: quem está na cena', () => {
  it('o grupo aparece, com o jogador primeiro', () => {
    const r = build({ playerCharacters: [player('u2', 'c2'), player('u1', 'c1')] });
    expect(r.map((x) => x.id)).toEqual(['c1', 'c2']);
    expect(r[0]).toMatchObject({ kind: 'player', isMe: true, userId: 'u1' });
    expect(r[1]).toMatchObject({ kind: 'player', isMe: false, userId: 'u2' });
  });

  it('personagem excluído ou marcado NPC ou inimigo não é do grupo', () => {
    const r = build({
      playerCharacters: [
        player('u1', 'c1'),
        player('u3', 'c3', { is_deleted: true }),
        player('u4', 'c4', { is_npc: true }),
        player('u5', 'c5', { is_enemy: true }),
      ],
    });
    expect(r.map((x) => x.id)).toEqual(['c1']);
  });

  it('só os NPCs visíveis entram', () => {
    const r = build({
      npcs: [
        ch('n1', { is_visible: true, is_playable: false }),
        ch('n2', { is_visible: false }),
        ch('n3', { is_visible: true, is_deleted: true }),
      ],
    });
    expect(r.filter((x) => x.kind === 'npc').map((x) => x.id)).toEqual(['n1']);
  });

  it('os inimigos só aparecem em combate, e só os que estão nele', () => {
    const enemies = [ch('e1'), ch('e2')];
    expect(build({ enemies }).filter((x) => x.kind === 'enemy')).toEqual([]);
    const r = build({
      enemies,
      hasActiveCombat: true,
      participants: [{ id: 'p-e1', entity_id: 'e1', hp_current: 7, conditions: [] }],
    });
    expect(r.filter((x) => x.kind === 'enemy').map((x) => x.id)).toEqual(['e1']);
  });

  it('o Mestre vê também o NPC escondido, marcado como tal', () => {
    const r = build({
      includeHidden: true,
      npcs: [
        ch('n1', { is_visible: true }),
        ch('n2', { is_visible: false }),
        ch('n3', { is_visible: false, is_deleted: true }),
      ],
    });
    const npcs = r.filter((x) => x.kind === 'npc');
    expect(npcs.map((x) => [x.id, x.hidden])).toEqual([
      ['n1', false],
      ['n2', true],
    ]);
  });

  it('a ordem é grupo, NPCs, inimigos', () => {
    const r = build({
      npcs: [ch('n1', { is_visible: true })],
      enemies: [ch('e1')],
      hasActiveCombat: true,
      participants: [{ id: 'p-e1', entity_id: 'e1', hp_current: 7, conditions: [] }],
    });
    expect(r.map((x) => x.kind)).toEqual(['player', 'player', 'npc', 'enemy']);
  });
});

describe('buildRetratos: PV e Condições', () => {
  it('fora do combate, o PV e as Condições vêm da ficha', () => {
    const r = build({
      playerCharacters: [
        player('u1', 'c1', {
          stats: { pv: 18, current_pv: 12 },
          conditions: [{ conditionId: 'amedrontado', duration: 2 }],
        }),
      ],
    });
    expect(r[0]).toMatchObject({
      pv: 12,
      pvMax: 18,
      conditions: [{ conditionId: 'amedrontado', duration: 2 }],
    });
  });

  it('em combate, vêm do participante (a ficha só recebe o PV no fim)', () => {
    const r = build({
      hasActiveCombat: true,
      participants: [
        {
          id: 'p1',
          entity_id: 'c1',
          hp_current: 4,
          conditions: [{ conditionId: 'caido', duration: null }],
        },
      ],
    });
    expect(r[0]).toMatchObject({
      pv: 4,
      pvMax: 12,
      participantId: 'p1',
      conditions: [{ conditionId: 'caido', duration: null }],
    });
  });

  it('em combate, quem não tem participante segue pela ficha', () => {
    const r = build({ hasActiveCombat: true, participants: [] });
    expect(r[0]).toMatchObject({ pv: 9, participantId: undefined });
  });

  it('fora do combate o participante que sobrou do combate anterior não conta', () => {
    const r = build({
      hasActiveCombat: false,
      participants: [{ id: 'p1', entity_id: 'c1', hp_current: 1, conditions: [] }],
    });
    expect(r[0]).toMatchObject({ pv: 9, participantId: undefined });
  });

  it('quem está a 0 PV é marcado como caído', () => {
    const r = build({
      playerCharacters: [player('u1', 'c1', { stats: { pv: 12, current_pv: 0 } })],
    });
    expect(r[0].down).toBe(true);
  });

  it('o nome vazio cai em "Jogador", "NPC" e "Inimigo"', () => {
    const r = build({
      playerCharacters: [player('u1', 'c1', { name: '' })],
      npcs: [ch('n1', { name: '', is_visible: true })],
      enemies: [ch('e1', { name: '' })],
      hasActiveCombat: true,
      participants: [{ id: 'p', entity_id: 'e1', hp_current: 5, conditions: [] }],
    });
    expect(r.map((x) => x.name)).toEqual(['Jogador', 'NPC', 'Inimigo']);
  });
});

describe('buildRetratos: o inimigo Oculto', () => {
  const enemies = [ch('e1', { is_visible: false }), ch('e2', { is_visible: true }), ch('e3')];
  const inCombat = {
    hasActiveCombat: true,
    participants: ['e1', 'e2', 'e3'].map((id) => ({
      id: `p-${id}`,
      entity_id: id,
      hp_current: 5,
      conditions: [],
    })),
  };

  it('o jogador não vê o inimigo Oculto, mesmo em combate; sem a marca, ele aparece', () => {
    const r = build({ ...inCombat, enemies });
    expect(r.filter((x) => x.kind === 'enemy').map((x) => x.id)).toEqual(['e2', 'e3']);
  });

  it('o inimigo Oculto com pin também não aparece para o jogador', () => {
    const r = build({ enemies, extraEnemies: new Set(['e1', 'e2']) });
    expect(r.filter((x) => x.kind === 'enemy').map((x) => x.id)).toEqual(['e2']);
  });

  it('o Mestre vê todos, com o Oculto marcado', () => {
    const r = build({ ...inCombat, enemies, includeHidden: true });
    const byId = Object.fromEntries(r.filter((x) => x.kind === 'enemy').map((x) => [x.id, x]));
    expect(byId.e1?.hidden).toBe(true);
    expect(byId.e2?.hidden).toBe(false);
    expect(byId.e3?.hidden).toBe(false);
  });
});

describe('hiddenEntityIds', () => {
  it('junta os NPCs e os inimigos com is_visible falso', () => {
    const ids = hiddenEntityIds(
      [
        { id: 'n1', is_visible: true },
        { id: 'n2', is_visible: false },
      ],
      [{ id: 'e1', is_visible: false }, { id: 'e2' }],
    );
    expect([...ids].sort()).toEqual(['e1', 'n2']);
  });

  it('sem nenhum Oculto, o conjunto é vazio', () => {
    expect(hiddenEntityIds([{ id: 'n1' }], [{ id: 'e1' }]).size).toBe(0);
  });
});
