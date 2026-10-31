// A cena do mapa: onde cada Retrato está no mapa, o que fica na Bandeja e o que cada pessoa vê.
// Termos: CONTEXT.md (Mapa, Bandeja, Retrato, pin).
import { describe, expect, it } from 'vitest';
import { buildMapScene, type PinRow } from './mapScene';

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
