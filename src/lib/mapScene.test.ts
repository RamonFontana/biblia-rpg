// A cena do mapa: onde cada Retrato está no mapa, o que fica na Bandeja e o que cada pessoa vê.
// Termos: CONTEXT.md (Mapa, Bandeja, Retrato, pin).
import { describe, expect, it } from 'vitest';
import { buildMapScene, distancesFrom, pinTargetOf, type PinRow } from './mapScene';

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
const player = (userId: string, id: string) => ({ user_id: userId, character: ch(id) });
const pin = (over: Partial<PinRow>): PinRow => ({
  id: `pin-${over.character_id ?? over.npc_id}`,
  map_id: 'm1',
  character_id: null,
  npc_id: null,
  col: 0,
  row: 0,
  ...over,
});

const base = {
  playerCharacters: [player('u1', 'c1'), player('u2', 'c2')],
  npcs: [
    ch('n-simples', { is_visible: true, is_playable: false }),
    ch('n-jogavel', { is_visible: true, is_playable: true, is_npc: true }),
  ],
  enemies: [ch('e1', { is_enemy: true }), ch('e2', { is_enemy: true })],
  myCharacterId: 'c1',
  hasActiveCombat: false,
  participants: [] as never[],
  pins: [] as PinRow[],
};
const scene = (over: Record<string, unknown> = {}) => buildMapScene({ ...base, ...over } as never);

describe('buildMapScene: posição e Bandeja', () => {
  it('o Retrato com pin aparece no Quadrado dele', () => {
    const s = scene({
      viewer: 'player',
      pins: [pin({ character_id: 'c1', col: 3, row: 4 })],
    });
    expect(s.pins).toEqual([expect.objectContaining({ cell: { col: 3, row: 4 } })]);
    expect(s.pins[0]?.retrato.id).toBe('c1');
  });

  it('o pin de NPC simples liga pelo id do NPC, e o de NPC jogável pelo da ficha', () => {
    const s = scene({
      viewer: 'player',
      pins: [
        pin({ npc_id: 'n-simples', col: 1, row: 1 }),
        pin({ character_id: 'n-jogavel', col: 2, row: 2 }),
      ],
    });
    expect(s.pins.map((p) => p.retrato.id).sort()).toEqual(['n-jogavel', 'n-simples']);
  });

  it('o Mestre vê quem não tem pin na Bandeja, de todo tipo, inclusive inimigo fora do combate', () => {
    const s = scene({ viewer: 'gm', pins: [pin({ character_id: 'c1' })] });
    expect(s.tray.map((r) => r.id).sort()).toEqual(['c2', 'e1', 'e2', 'n-jogavel', 'n-simples']);
    expect(s.pins.map((p) => p.retrato.id)).toEqual(['c1']);
  });

  it('o jogador não vê a Bandeja nem quem não tem pin', () => {
    const s = scene({ viewer: 'player', pins: [pin({ character_id: 'c1' })] });
    expect(s.tray).toEqual([]);
    expect(s.pins.map((p) => p.retrato.id)).toEqual(['c1']);
  });

  it('o espectador também só vê quem tem pin', () => {
    const s = scene({ viewer: 'spectator', pins: [pin({ character_id: 'c2' })] });
    expect(s.tray).toEqual([]);
    expect(s.pins.map((p) => p.retrato.id)).toEqual(['c2']);
  });

  it('o inimigo com pin aparece mesmo fora do combate; sem pin, o jogador não o vê', () => {
    const s = scene({ viewer: 'player', pins: [pin({ character_id: 'e1', col: 5, row: 5 })] });
    expect(s.pins.map((p) => p.retrato.id)).toEqual(['e1']);
    expect(s.pins[0]?.retrato.kind).toBe('enemy');
  });

  it('o NPC escondido não aparece para o jogador, mesmo com pin, e o Mestre o vê marcado', () => {
    const npcs = [ch('n-simples', { is_visible: false, is_playable: false })];
    const pins = [pin({ npc_id: 'n-simples', col: 1, row: 1 })];
    expect(scene({ viewer: 'player', npcs, pins }).pins).toEqual([]);
    const gm = scene({ viewer: 'gm', npcs, pins });
    expect(gm.pins[0]?.retrato).toMatchObject({ id: 'n-simples', hidden: true });
  });

  it('pin de quem saiu da sessão (ficha excluída) é ignorado', () => {
    const s = scene({
      viewer: 'gm',
      playerCharacters: [{ user_id: 'u1', character: ch('c1', { is_deleted: true }) }],
      pins: [pin({ character_id: 'c1' })],
    });
    expect(s.pins).toEqual([]);
    expect(s.tray.map((r) => r.id)).not.toContain('c1');
  });

  it('marca o Retrato do próprio jogador, para o botão de centralizar', () => {
    const s = scene({
      viewer: 'player',
      pins: [pin({ character_id: 'c1' }), pin({ character_id: 'c2' })],
    });
    expect(s.pins.find((p) => p.retrato.isMe)?.retrato.id).toBe('c1');
  });

  it('em combate o PV do pin vem do participante', () => {
    const s = scene({
      viewer: 'player',
      hasActiveCombat: true,
      participants: [{ id: 'p-e1', entity_id: 'e1', hp_current: 3, conditions: [] }],
      pins: [pin({ character_id: 'e1' })],
    });
    expect(s.pins[0]?.retrato).toMatchObject({ pv: 3, participantId: 'p-e1' });
  });
});

describe('pinTargetOf', () => {
  it('o NPC simples liga pelo npc_id; ficha, NPC jogável e inimigo pelo character_id', () => {
    const s = scene({ viewer: 'gm' });
    const kinds = Object.fromEntries(s.tray.map((r) => [r.id, pinTargetOf(r).kind]));
    expect(kinds).toEqual({
      c1: 'character',
      c2: 'character',
      'n-simples': 'npc',
      'n-jogavel': 'character',
      e1: 'character',
      e2: 'character',
    });
  });
});

describe('buildMapScene: o turno', () => {
  const pins = [
    pin({ character_id: 'c1', col: 1, row: 1 }),
    pin({ character_id: 'c2', col: 2, row: 2 }),
  ];

  it('marca o pin de quem age agora', () => {
    const s = scene({ viewer: 'player', pins, turnEntityId: 'c2' });
    expect(s.pins.map((p) => [p.retrato.id, p.turn])).toEqual([
      ['c1', false],
      ['c2', true],
    ]);
  });

  it('sem combate, ninguém está de turno', () => {
    const s = scene({ viewer: 'player', pins });
    expect(s.pins.every((p) => p.turn === false)).toBe(true);
  });
});

describe('distancesFrom: a distância até cada pin', () => {
  const pins = [
    pin({ character_id: 'c1', col: 2, row: 2 }),
    pin({ character_id: 'e1', col: 8, row: 2 }),
    pin({ character_id: 'c2', col: 5, row: 5 }),
  ];

  it('mede em metros a partir do pin de quem pergunta, com a diagonal valendo um Quadrado', () => {
    const s = scene({ viewer: 'player', pins });
    expect(distancesFrom(s, 'c1')).toEqual({ e1: 9, c2: 4.5 });
  });

  it('não inclui o próprio pin', () => {
    expect(distancesFrom(scene({ viewer: 'player', pins }), 'c1')).not.toHaveProperty('c1');
  });

  it('sem pin de quem pergunta, não há distância nenhuma', () => {
    expect(distancesFrom(scene({ viewer: 'player', pins }), 'c-fora')).toEqual({});
  });

  it('quem não tem pin fica sem distância', () => {
    const s = scene({ viewer: 'player', pins: [pins[0]!] });
    expect(distancesFrom(s, 'c1')).toEqual({});
  });
});

describe('buildMapScene: o inimigo Oculto', () => {
  const enemies = [ch('e1', { is_enemy: true, is_visible: false }), ch('e2', { is_enemy: true })];
  const pins = [
    pin({ character_id: 'e1', col: 4, row: 4 }),
    pin({ character_id: 'e2', col: 5, row: 5 }),
  ];

  it('o jogador e o espectador não veem o pin do inimigo Oculto', () => {
    for (const viewer of ['player', 'spectator'] as const) {
      const s = scene({ viewer, enemies, pins });
      expect(s.pins.map((p) => p.retrato.id)).toEqual(['e2']);
    }
  });

  it('o Mestre vê o pin do Oculto, marcado', () => {
    const s = scene({ viewer: 'gm', enemies, pins });
    expect(s.pins.find((p) => p.retrato.id === 'e1')?.retrato.hidden).toBe(true);
  });

  it('o Oculto sem pin espera na Bandeja do Mestre, marcado', () => {
    const s = scene({ viewer: 'gm', enemies, pins: [] });
    expect(s.tray.find((r) => r.id === 'e1')?.hidden).toBe(true);
  });
});
