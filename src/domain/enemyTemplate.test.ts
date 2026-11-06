// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ENEMY_PRESETS, findEnemyPreset } from '@/content/enemyPresets';
import type { EnemyPresetDefinition } from '@/content/schemas';
import { applyEndemoniado, canApplyEndemoniado, type TemplateEnemy } from './enemyTemplate';

const enemyOf = (preset: EnemyPresetDefinition): TemplateEnemy => ({
  name: preset.name,
  nameGender: preset.nameGender,
  creatureType: preset.creatureType,
  hp: preset.hp,
  hitDice: preset.hitDice,
  attributes: preset.attributes,
  attacks: preset.attacks,
  abilities: preset.abilities,
  conditionImmunities: preset.conditionImmunities ?? [],
  saveBonuses: preset.saveBonuses,
  proficiencies: preset.details.proficiencies,
  endemoniado: preset.endemoniado,
});

const endemoniadoOf = (id: string) => {
  const preset = findEnemyPreset(`enemy-preset-${id}`);
  if (!preset) throw new Error(id);
  return applyEndemoniado(enemyOf(preset));
};

describe('Template Endemoniado sobre o Bandido do Deserto', () => {
  const result = endemoniadoOf('bandido-do-deserto');

  it('FOR e CON sobem 4, INT cai a 6 e o PV segue o dado de vida com a nova CON (15)', () => {
    expect(result.attributes).toMatchObject({ for: 15, con: 16, int: 6, des: 12, car: 10 });
    expect(result.hitDice).toEqual({ count: 2, sides: 8, bonus: 6 });
    expect(result.hp).toBe(15);
  });

  it('a tendência vira Caótico e Mau e o nome ganha o sufixo', () => {
    expect(result.creatureType).toBe('Médio, Humano, Caótico e Mau');
    expect(result.name).toBe('Bandido do Deserto Endemoniado');
  });

  it('imune a Amedrontado e com as passivas do Template', () => {
    expect(result.conditionImmunities).toEqual(['amedrontado']);
    const names = result.abilities.map((a) => a.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'Ataque Furtivo',
        'Fúria Desumana',
        'Vulnerabilidade Espiritual',
        'Grito Atormentador (Recarga 5-6)',
      ]),
    );
    expect(result.abilities.find((a) => a.name.startsWith('Grito'))?.libraryId).toBe(
      'enemy-grito-atormentador',
    );
    expect(result.endemoniado).toBe(true);
  });

  it('Intimidação = modificador de CAR + 2, se o inimigo ainda não tem a perícia', () => {
    expect(result.proficiencies).toBe('Furtividade +3, Sobrevivência +2, Intimidação +2');
  });

  it('a Acuidade passa a FOR quando ela fica maior; o ataque de DES não muda', () => {
    const [dagger, sling] = result.attacks;
    // FOR 11 (+0) contra DES 12 (+1) → FOR 15 (+2): +1 de acerto e de dano.
    expect(dagger).toMatchObject({
      attribute: 'for',
      hitBonus: 4,
      damage: { dice: '1d4', bonus: 2 },
    });
    expect(sling).toMatchObject({
      attribute: 'des',
      hitBonus: 3,
      damage: { dice: '1d4', bonus: 1 },
    });
  });

  it('ganha o Ataque Bestial: +(mod FOR + 2), 1d6 + mod FOR perfurante', () => {
    expect(result.attacks.at(-1)).toMatchObject({
      name: 'Ataque Bestial (Garras/Mordida)',
      attribute: 'for',
      hitBonus: 4,
      damage: { dice: '1d6', bonus: 2 },
      damageType: 'perfurante',
    });
  });
});

describe('Template Endemoniado sobre os outros Presets', () => {
  it('Leão da Judeia: 34 PV, FOR 21, CON 17, INT segue 3; ataques de FOR +2', () => {
    const lion = endemoniadoOf('leao-da-judeia');
    expect(lion.hp).toBe(34);
    expect(lion.hitDice).toEqual({ count: 4, sides: 10, bonus: 12 });
    expect(lion.attributes).toMatchObject({ for: 21, con: 17, int: 3 });
    expect(lion.name).toBe('Leão da Judeia Endemoniado');
    expect(lion.creatureType).toBe('Grande, Fera, Caótico e Mau');
    expect(lion.attacks[0]).toMatchObject({
      name: 'Mordida',
      hitBonus: 7,
      damage: { dice: '1d8', bonus: 5 },
    });
    expect(lion.attacks[1]).toMatchObject({
      name: 'Garra',
      hitBonus: 7,
      damage: { dice: '1d6', bonus: 5 },
    });
  });

  it('Víbora do Deserto: o nome concorda em gênero e o ataque de DES não muda', () => {
    const viper = endemoniadoOf('vibora-do-deserto');
    expect(viper.name).toBe('Víbora do Deserto Endemoniada');
    expect(viper.attributes).toMatchObject({ for: 6, con: 15 });
    expect(viper.attacks[0]).toMatchObject({ attribute: 'des', hitBonus: 5, damage: { bonus: 1 } });
    expect(viper.hp).toBe(4);
  });

  it('General de Guerra: já tem Intimidação, então a perícia não muda', () => {
    const general = endemoniadoOf('general-de-guerra');
    expect(general.proficiencies).toBe('Atletismo +5, História +4, Intimidação +4');
    expect(general.attributes).toMatchObject({ for: 20, con: 18, int: 6 });
    expect(general.hp).toBe(68);
    expect(general.attacks[0]).toMatchObject({ hitBonus: 7, damage: { dice: '1d8', bonus: 5 } });
  });

  it('Guerreiro Anakim: INT cai a 6, já era imune só pelo Template e a tendência muda', () => {
    const anakim = endemoniadoOf('guerreiro-anakim');
    expect(anakim.attributes).toMatchObject({ for: 25, con: 20, int: 6 });
    expect(anakim.hp).toBe(103);
    expect(anakim.creatureType).toBe('Enorme, Humanoide (Gigante), Caótico e Mau');
    expect(anakim.conditionImmunities).toEqual(['amedrontado']);
    expect(anakim.attacks[0]).toMatchObject({
      name: 'Lança Imensa',
      hitBonus: 9,
      damage: { dice: '2d8', bonus: 7 },
    });
  });

  it('os bônus fixos de TR de FOR e CON sobem junto com o modificador (+2)', () => {
    expect(endemoniadoOf('general-de-guerra').saveBonuses).toEqual({ for: 7, con: 6 });
    expect(endemoniadoOf('guerreiro-anakim').saveBonuses).toEqual({ for: 9, con: 7 });
  });

  it('só sobe o bônus que o bloco tem: SAB do Sacerdote fica, e sem bônus fixo nada é criado', () => {
    expect(endemoniadoOf('bandido-do-deserto').saveBonuses).toBeUndefined();
    const withSab = applyEndemoniado({
      ...enemyOf(findEnemyPreset('enemy-preset-bandido-do-deserto') as EnemyPresetDefinition),
      saveBonuses: { sab: 5, con: 4 },
    });
    expect(withSab.saveBonuses).toEqual({ sab: 5, con: 6 });
  });

  it('o Template troca a tendência mesmo quando ela tem barra ("Leal e Neutro/Mau")', () => {
    const general = endemoniadoOf('general-de-guerra');
    expect(general.creatureType).toBe('Médio, Humano, Caótico e Mau');
  });
});

describe('Template Endemoniado: casos de borda', () => {
  it('inimigo do zero (sem dado de vida) mantém o PV', () => {
    const fromScratch: TemplateEnemy = {
      name: 'Lobo',
      nameGender: 'm',
      creatureType: '',
      hp: 22,
      attributes: { for: 12, des: 12, con: 12, int: 4, sab: 10, car: 8 },
      attacks: [],
      abilities: [],
      conditionImmunities: [],
    };
    const result = applyEndemoniado(fromScratch);
    expect(result.hp).toBe(22);
    expect(result.hitDice).toBeUndefined();
    expect(result.name).toBe('Lobo Endemoniado');
    expect(result.creatureType).toBe('Caótico e Mau');
    expect(result.attributes).toMatchObject({ for: 16, con: 16, int: 4 });
    expect(result.proficiencies).toBe('Intimidação +1');
  });

  it('o Endemoniado Comum recusa o Template', () => {
    const common = findEnemyPreset('enemy-preset-endemoniado-comum');
    expect(common?.endemoniado).toBe(true);
    const enemy = enemyOf(common!);
    expect(canApplyEndemoniado(enemy)).toBe(false);
    expect(applyEndemoniado(enemy)).toEqual(enemy);
  });

  it('só o Endemoniado Comum é Endemoniado; todos os outros aceitam o Template', () => {
    expect(ENEMY_PRESETS.filter((p) => !canApplyEndemoniado(enemyOf(p))).map((p) => p.id)).toEqual([
      'enemy-preset-endemoniado-comum',
    ]);
  });

  it('não duplica uma Habilidade que o inimigo já tem', () => {
    const preset = findEnemyPreset('enemy-preset-bandido-do-deserto')!;
    const once = applyEndemoniado({ ...enemyOf(preset), endemoniado: false });
    const names = once.abilities.map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('não muda o inimigo de entrada', () => {
    const preset = findEnemyPreset('enemy-preset-bandido-do-deserto')!;
    const input = enemyOf(preset);
    const snapshot = structuredClone(input);
    applyEndemoniado(input);
    expect(input).toEqual(snapshot);
  });
});
