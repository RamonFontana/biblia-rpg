// @vitest-environment node
//
// Os Presets de src/content/enemyPresets.ts vêm dos blocos de docs/bestiario/, e docs/ é a fonte
// da verdade das regras. Este teste trava a divergência: cada Preset tem o bloco do doc, com o
// mesmo PV, dado de vida, CA, atributos, bônus de TR e os mesmos ataques (acerto, dano e tipo).
// Divergiu? Registre no ROADMAP e pergunte ao autor qual vale.
import { describe, expect, it } from 'vitest';
import { ENEMY_PRESETS } from './enemyPresets';
import type { EnemyPresetDefinition } from './schemas';

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const ATTRIBUTES = ['for', 'des', 'con', 'int', 'sab', 'car'] as const;
type Attribute = (typeof ATTRIBUTES)[number];

interface DocAttack {
  hitBonus: number;
  dice: string | undefined;
  bonus: number;
  damageType: string;
}

interface DocBlock {
  ca: number;
  hp: number;
  hitDice: string;
  attributes: Record<Attribute, number>;
  saveBonuses: Partial<Record<Attribute, number>>;
  conditionImmunities: string[];
  attacks: Map<string, DocAttack>;
}

const signed = (s: string) => Number(s.replace('−', '-'));

function readBlock(text: string): DocBlock {
  const ca = text.match(/Classe de Armadura \(CA\)\*\*:\s*(\d+)/);
  const hp = text.match(/Pontos de Vida \(PV\)\*\*:\s*(\d+) \(([^)]+)\)/);
  const row = text.match(
    /\|\s*(\d+) \([^)]*\)\s*\|\s*(\d+) \([^)]*\)\s*\|\s*(\d+) \([^)]*\)\s*\|\s*(\d+) \([^)]*\)\s*\|\s*(\d+) \([^)]*\)\s*\|\s*(\d+) \([^)]*\)\s*\|/,
  );
  if (!ca || !hp || !row) throw new Error('bloco do doc sem CA, PV ou atributos');

  const saveBonuses: DocBlock['saveBonuses'] = {};
  const saves = text.match(/Testes de Resistência\*\*:\s*(.+)/);
  for (const [, name, value] of (saves?.[1] ?? '').matchAll(
    /(For|Des|Con|Int|Sab|Car) ([+-]\d+)/gi,
  )) {
    saveBonuses[name.toLowerCase() as Attribute] = signed(value);
  }

  const attacks = new Map<string, DocAttack>();
  for (const line of text.split('\n')) {
    const attack = line.match(
      /^- \*\*([^*]+?)\*\*: \*Ataque[^*]*\* ([+-]\d+) para acertar.*\*Dano\*: (\d+) (?:\((\d+d\d+)(?: \+ (\d+))?\) )?(\p{L}+(?: ou \p{L}+)?)/u,
    );
    if (!attack) continue;
    const [, name, hit, flat, dice, bonus, damageType] = attack;
    attacks.set(normalize(name), {
      hitBonus: signed(hit),
      dice,
      bonus: dice ? Number(bonus ?? 0) : Number(flat),
      damageType: normalize(damageType),
    });
  }

  const immunities = text.match(/Imunidades de Condição\*\*:\s*(.+)/);

  return {
    conditionImmunities: (immunities?.[1] ?? '')
      .split(',')
      .map(normalize)
      .map((c) => c.trim())
      .filter(Boolean),
    ca: Number(ca[1]),
    hp: Number(hp[1]),
    hitDice: hp[2].replace(/\s/g, ''),
    attributes: Object.fromEntries(ATTRIBUTES.map((a, i) => [a, Number(row[i + 1])])) as Record<
      Attribute,
      number
    >,
    saveBonuses,
    attacks,
  };
}

/** Os blocos de docs/bestiario/*.md, por nome normalizado (um título "# Nome" ou "### Nome" abre cada bloco). */
function readDocBlocks(): Map<string, DocBlock> {
  const files = import.meta.glob('../../docs/bestiario/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  const blocks = new Map<string, DocBlock>();
  for (const text of Object.values(files)) {
    for (const part of text.split(/^#{1,3} /m).slice(1)) {
      const title = part
        .split('\n', 1)[0]
        .replace(/\s*\(Ex:.*\)\s*$/, '')
        .trim();
      if (!/Classe de Armadura/.test(part)) continue;
      blocks.set(normalize(title), readBlock(part));
    }
  }
  return blocks;
}

const hitDiceText = (p: EnemyPresetDefinition) => {
  const { count, sides, bonus } = p.hitDice;
  return `${count}d${sides}${bonus > 0 ? `+${bonus}` : ''}`;
};

describe('Presets de inimigo × blocos dos docs', () => {
  const blocks = readDocBlocks();

  it('lê os blocos dos docs', () => {
    expect(blocks.size).toBe(10);
  });

  it('todo bloco do doc tem o Preset, pelo nome', () => {
    const presetNames = new Set(ENEMY_PRESETS.map((p) => normalize(p.name)));
    expect([...blocks.keys()].filter((name) => !presetNames.has(name))).toEqual([]);
  });

  it('todo Preset tem o bloco do doc, pelo nome', () => {
    expect(ENEMY_PRESETS.filter((p) => !blocks.has(normalize(p.name))).map((p) => p.id)).toEqual(
      [],
    );
  });

  describe.each(ENEMY_PRESETS)('$name', (preset) => {
    const block = blocks.get(normalize(preset.name));

    it('bate em CA, PV, dado de vida e atributos', () => {
      expect(block).toBeDefined();
      expect({
        ca: preset.ca,
        hp: preset.hp,
        hitDice: hitDiceText(preset),
        attributes: preset.attributes,
      }).toEqual({
        ca: block?.ca,
        hp: block?.hp,
        hitDice: block?.hitDice,
        attributes: block?.attributes,
      });
    });

    it('bate nos bônus de TR do bloco', () => {
      expect(preset.saveBonuses ?? {}).toEqual(block?.saveBonuses);
    });

    it('bate nas imunidades a Condição', () => {
      expect(preset.conditionImmunities ?? []).toEqual(block?.conditionImmunities);
    });

    it('bate nos ataques com dano em dado (acerto, dano e tipo)', () => {
      for (const [name, docAttack] of block?.attacks ?? []) {
        const attack = preset.attacks.find((a) => normalize(a.name) === name);
        expect(attack, `ataque "${name}" falta no Preset`).toBeDefined();
        expect({
          hitBonus: attack?.hitBonus,
          dice: attack?.damage.dice,
          bonus: attack?.damage.bonus,
          damageType: normalize(attack?.damageType ?? ''),
        }).toEqual(docAttack);
      }
    });

    it('não inventa ataque que o doc não tem', () => {
      const docNames = new Set([...(block?.attacks.keys() ?? [])]);
      expect(preset.attacks.map((a) => normalize(a.name)).filter((n) => !docNames.has(n))).toEqual(
        [],
      );
    });
  });
});
