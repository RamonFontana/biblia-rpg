// A cena do mapa: onde cada Retrato está no mapa, o que fica na Bandeja e o que cada pessoa vê.
// Termos: CONTEXT.md (Mapa, Bandeja, Retrato, pin).
import { describe, expect, it } from 'vitest';
import { buildMapScene, distancesFrom, pinTargetOf, type LightRow, type PinRow } from './mapScene';

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

describe('buildMapScene: a luz', () => {
  const night = { period: 'Noite' as const };
  const lamp = (over: Partial<LightRow> = {}): LightRow => ({
    id: 'l1',
    map_id: 'm1',
    col: 10,
    row: 10,
    bright_m: 6,
    dim_m: 6,
    label: 'Fogueira',
    ...over,
  });
  const pins = [
    pin({ character_id: 'c1', col: 0, row: 0 }),
    pin({ character_id: 'e1', col: 10, row: 10 }),
    pin({ character_id: 'e2', col: 30, row: 30 }),
    pin({ npc_id: 'n-simples', col: 12, row: 10 }),
  ];
  const ids = (s: ReturnType<typeof scene>) => s.pins.map((p) => p.retrato.id).sort();

  it('de dia, o Ambiente é claro e todos aparecem', () => {
    const s = scene({ viewer: 'player', pins, period: 'Manhã' });
    expect(ids(s)).toEqual(['c1', 'e1', 'e2', 'n-simples']);
    expect(s.pins.every((p) => p.level === 'plena')).toBe(true);
    expect(s.ambient).toBe('claro');
  });

  it('à noite, sem luz, só o grupo aparece para o jogador', () => {
    const s = scene({ viewer: 'player', pins, ...night });
    expect(ids(s)).toEqual(['c1']);
    expect(s.ambient).toBe('escuridao');
  });

  it('o grupo aparece sempre, mesmo no escuro, e o nível dele é o da luz do lugar', () => {
    const s = scene({ viewer: 'player', pins, ...night });
    expect(s.pins.find((p) => p.retrato.id === 'c1')?.level).toBe('escuridao');
  });

  it('inimigo e NPC iluminados por uma fonte fixa aparecem; os fora da luz, não', () => {
    const s = scene({ viewer: 'player', pins, lights: [lamp()], ...night });
    expect(ids(s)).toEqual(['c1', 'e1', 'n-simples']);
    expect(s.pins.find((p) => p.retrato.id === 'e1')?.level).toBe('plena');
  });

  it('na Penumbra o Retrato aparece, e o nível diz que é Penumbra', () => {
    // O NPC está a 2 Quadrados (3 m) da fonte de 1,5 m de Luz plena + 6 m de Penumbra.
    const s = scene({
      viewer: 'player',
      pins,
      lights: [lamp({ bright_m: 1.5, dim_m: 6 })],
      ...night,
    });
    expect(s.pins.find((p) => p.retrato.id === 'n-simples')?.level).toBe('penumbra');
  });

  it('o Ambiente fixado no mapa vale mais que o período', () => {
    expect(ids(scene({ viewer: 'player', pins, ambient: 'claro', ...night }))).toEqual([
      'c1',
      'e1',
      'e2',
      'n-simples',
    ]);
    expect(ids(scene({ viewer: 'player', pins, ambient: 'escuridao', period: 'Manhã' }))).toEqual([
      'c1',
    ]);
    expect(ids(scene({ viewer: 'player', pins, ambient: 'penumbra', ...night }))).toEqual([
      'c1',
      'e1',
      'e2',
      'n-simples',
    ]);
  });

  it('a luz no pin de um inimigo o ilumina, e a luz dele ilumina quem está perto', () => {
    const withTorch = [
      pin({ character_id: 'c1', col: 0, row: 0 }),
      pin({ character_id: 'e1', col: 10, row: 10, light_bright_m: 6, light_dim_m: 6 }),
      pin({ character_id: 'e2', col: 12, row: 10 }),
    ];
    const s = scene({ viewer: 'player', pins: withTorch, ...night });
    expect(ids(s)).toEqual(['c1', 'e1', 'e2']);
  });

  it('o Oculto vale por cima: a luz de um Oculto não revela o lugar dele nem ilumina os outros', () => {
    const enemies = [ch('e1', { is_enemy: true, is_visible: false }), ch('e2', { is_enemy: true })];
    const withTorch = [
      pin({ character_id: 'e1', col: 10, row: 10, light_bright_m: 6, light_dim_m: 6 }),
      pin({ character_id: 'e2', col: 12, row: 10 }),
    ];
    const s = scene({ viewer: 'player', enemies, pins: withTorch, ...night });
    expect(ids(s)).toEqual([]);
    expect(s.sources).toEqual([]);
  });

  it('o Mestre vê todos, com o nível de luz de cada um, e a luz do Oculto conta', () => {
    const enemies = [ch('e1', { is_enemy: true, is_visible: false })];
    const withTorch = [
      pin({ character_id: 'e1', col: 10, row: 10, light_bright_m: 6, light_dim_m: 6 }),
      pin({ character_id: 'c1', col: 30, row: 30 }),
    ];
    const s = scene({ viewer: 'gm', enemies, pins: withTorch, ...night });
    expect(ids(s)).toEqual(['c1', 'e1']);
    expect(s.pins.find((p) => p.retrato.id === 'e1')?.level).toBe('plena');
    expect(s.pins.find((p) => p.retrato.id === 'c1')?.level).toBe('escuridao');
    expect(s.sources).toHaveLength(1);
  });

  it('o Mestre também vê quem está no escuro', () => {
    expect(ids(scene({ viewer: 'gm', pins, ...night }))).toEqual(['c1', 'e1', 'e2', 'n-simples']);
  });

  it('o espectador vê como o jogador', () => {
    expect(ids(scene({ viewer: 'spectator', pins, lights: [lamp()], ...night }))).toEqual([
      'c1',
      'e1',
      'n-simples',
    ]);
  });

  it('devolve as fontes de luz (fixas e dos pins) para a máscara de escuridão', () => {
    const withTorch = [
      pin({ character_id: 'e2', col: 5, row: 5, light_bright_m: 3, light_dim_m: 3 }),
    ];
    const s = scene({ viewer: 'gm', pins: withTorch, lights: [lamp()], ...night });
    expect(s.sources).toEqual(
      expect.arrayContaining([
        { cell: { col: 10, row: 10 }, brightM: 6, dimM: 6 },
        { cell: { col: 5, row: 5 }, brightM: 3, dimM: 3 },
      ]),
    );
    expect(s.sources).toHaveLength(2);
  });

  it('as luzes fixas vão na cena, para o Mestre mover', () => {
    const s = scene({ viewer: 'gm', pins: [], lights: [lamp()], ...night });
    expect(s.lights).toEqual([expect.objectContaining({ id: 'l1', label: 'Fogueira' })]);
  });

  it('a luz não filtra o que está na Bandeja do Mestre', () => {
    const s = scene({ viewer: 'gm', pins: [], ...night });
    expect(s.tray.length).toBeGreaterThan(0);
  });
});

describe('buildMapScene: a luz que o pin carrega', () => {
  it('devolve os raios do pin, ou nulo quando não há luz', () => {
    const s = scene({
      viewer: 'gm',
      pins: [
        pin({ character_id: 'e1', col: 1, row: 1, light_bright_m: 6, light_dim_m: 3 }),
        pin({ character_id: 'e2', col: 2, row: 2 }),
      ],
    });
    expect(s.pins.find((p) => p.retrato.id === 'e1')?.light).toEqual({ brightM: 6, dimM: 3 });
    expect(s.pins.find((p) => p.retrato.id === 'e2')?.light).toBeNull();
  });
});

describe('buildMapScene: a Visão', () => {
  const blind = [{ conditionId: 'cego', duration: null }];
  const pins = [
    pin({ character_id: 'c1', col: 0, row: 0 }),
    pin({ character_id: 'c2', col: 1, row: 0 }),
    pin({ character_id: 'e1', col: 4, row: 0 }),
    pin({ npc_id: 'n-simples', col: 5, row: 0 }),
  ];
  const withBlind = (...ids: string[]) =>
    ({
      playerCharacters: ['c1', 'c2'].map((id) => ({
        user_id: `u-${id}`,
        character: ch(id, { conditions: ids.includes(id) ? blind : [] }),
      })),
    }) as Record<string, unknown>;
  const ids = (s: ReturnType<typeof scene>) => s.pins.map((p) => p.retrato.id).sort();

  it('o jogador Cego não vê inimigos nem NPCs, mas vê os companheiros', () => {
    const s = scene({ viewer: 'player', pins, ...withBlind('c1') });
    expect(ids(s)).toEqual(['c1', 'c2']);
  });

  it('o Cego de outro jogador não muda o que este jogador vê', () => {
    const s = scene({ viewer: 'player', pins, ...withBlind('c2') });
    expect(ids(s)).toEqual(['c1', 'c2', 'e1', 'n-simples']);
  });

  it('o Mestre vê todos, mesmo com o grupo Cego', () => {
    const s = scene({ viewer: 'gm', pins, ...withBlind('c1', 'c2') });
    expect(ids(s)).toEqual(['c1', 'c2', 'e1', 'n-simples']);
  });

  it('"Ver como" mostra o mapa pela Visão do personagem: Cego não vê inimigos', () => {
    expect(ids(scene({ viewer: 'gm', viewAs: 'c1', pins, ...withBlind('c1') }))).toEqual([
      'c1',
      'c2',
    ]);
    expect(ids(scene({ viewer: 'gm', viewAs: 'c2', pins, ...withBlind('c1') }))).toEqual([
      'c1',
      'c2',
      'e1',
      'n-simples',
    ]);
  });

  it('"Ver como" respeita a luz e o Oculto, e não mostra a Bandeja', () => {
    const s = scene({
      viewer: 'gm',
      viewAs: 'c1',
      pins: [pin({ character_id: 'c1', col: 0, row: 0 }), pin({ character_id: 'e1', col: 30 })],
      period: 'Noite',
    });
    expect(ids(s)).toEqual(['c1']);
    expect(s.tray).toEqual([]);
    const hidden = scene({
      viewer: 'gm',
      viewAs: 'c1',
      pins,
      enemies: [ch('e1', { is_enemy: true, is_visible: false }), ch('e2', { is_enemy: true })],
    });
    expect(ids(hidden)).not.toContain('e1');
  });

  it('o espectador vê pela soma do grupo: basta um companheiro enxergar', () => {
    expect(ids(scene({ viewer: 'spectator', pins, ...withBlind('c1') }))).toContain('e1');
    expect(ids(scene({ viewer: 'spectator', pins, ...withBlind('c1', 'c2') }))).toEqual([
      'c1',
      'c2',
    ]);
  });
});

describe('buildMapScene: a Tocha acesa', () => {
  const pins = [
    pin({ character_id: 'c1', col: 0, row: 0 }),
    pin({ character_id: 'e1', col: 3, row: 0 }),
    pin({ character_id: 'e2', col: 30, row: 30 }),
  ];
  const torchBearer = (lit: boolean) => ({
    playerCharacters: [
      { user_id: 'u1', character: ch('c1', { torch_lit: lit }) },
      player('u2', 'c2'),
    ],
  });
  const ids = (s: ReturnType<typeof scene>) => s.pins.map((p) => p.retrato.id).sort();

  it('à noite, a Tocha acesa ilumina 6 m + 6 m em volta do pin e revela o inimigo perto', () => {
    const s = scene({ viewer: 'player', pins, period: 'Noite', ...torchBearer(true) });
    expect(ids(s)).toEqual(['c1', 'e1']);
    expect(s.sources).toEqual([{ cell: { col: 0, row: 0 }, brightM: 6, dimM: 6 }]);
    const mine = s.pins.find((p) => p.retrato.id === 'c1');
    expect(mine?.torch).toBe(true);
    expect(mine?.light).toEqual({ brightM: 6, dimM: 6 });
  });

  it('sem Tocha acesa não há fonte, e a luz some quando ela apaga', () => {
    const s = scene({ viewer: 'player', pins, period: 'Noite', ...torchBearer(false) });
    expect(ids(s)).toEqual(['c1']);
    expect(s.sources).toEqual([]);
  });

  it('a Tocha acesa vale em qualquer mapa onde o pin estiver', () => {
    const other = [pin({ character_id: 'c1', col: 5, row: 5, map_id: 'm2' })];
    const s = scene({ viewer: 'gm', pins: other, ...torchBearer(true) });
    expect(s.sources).toEqual([{ cell: { col: 5, row: 5 }, brightM: 6, dimM: 6 }]);
  });
});
