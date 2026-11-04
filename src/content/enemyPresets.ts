// O Bestiário: os Presets de inimigo de docs/bestiario/, com os números dos docs (o teste
// enemyPresetsDocs.test.ts trava a divergência). Criar um inimigo copia o Preset (ADR 0012). O `id`
// fica gravado como origem do inimigo: nunca o renomeie. As Habilidades com `libraryId` trazem o
// efeito da biblioteca de Habilidades de inimigo (enemyAbilities.ts); as demais são texto.
import type { EnemyPresetDefinition } from './schemas';

export const ENEMY_PRESETS: EnemyPresetDefinition[] = [
  {
    id: 'enemy-preset-bandido-do-deserto',
    name: 'Bandido do Deserto',
    nameGender: 'm',
    description: 'Salteadores de beira de estrada com ataque furtivo e funda.',
    creatureType: 'Médio, Humano, Neutro e Mau',
    hitDice: { count: 2, sides: 8, bonus: 2 },
    hp: 11,
    ca: 12,
    caSource: 'Couro cru',
    attributes: { for: 11, des: 12, con: 12, int: 10, sab: 10, car: 10 },
    abilities: [
      {
        name: 'Ataque Furtivo',
        description:
          'Uma vez por turno, o bandido causa 1d6 de dano extra se tiver vantagem na jogada ou se outro inimigo do alvo estiver a até 1,5m do alvo.',
      },
    ],
    attacks: [
      {
        name: 'Adaga de Bronze',
        mode: 'both',
        attribute: 'finesse',
        hitBonus: 3,
        reach: '1,5m ou arremesso 6/18m',
        damage: { dice: '1d4', bonus: 1 },
        damageType: 'perfurante',
      },
      {
        name: 'Funda',
        mode: 'ranged',
        attribute: 'des',
        hitBonus: 3,
        reach: '9/36m',
        damage: { dice: '1d4', bonus: 1 },
        damageType: 'concussão',
      },
    ],
    details: {
      speed: '9 m',
      proficiencies: 'Furtividade +3, Sobrevivência +2',
      senses: 'Percepção passiva 10',
      challenge: '1/8 (25 XP)',
    },
  },
  {
    id: 'enemy-preset-soldado-filisteu',
    name: 'Soldado Filisteu',
    nameGender: 'm',
    description: 'Soldados bem treinados com cota de escamas e formação em parede.',
    creatureType: 'Médio, Humano, Leal e Mau',
    hitDice: { count: 3, sides: 8, bonus: 3 },
    hp: 16,
    ca: 14,
    caSource: 'Cota de escamas de bronze, Escudo',
    attributes: { for: 14, des: 11, con: 13, int: 10, sab: 10, car: 11 },
    abilities: [
      {
        name: 'Formação em Parede',
        description:
          'O soldado tem Vantagem em testes de resistência de Força e Destreza enquanto estiver a até 1,5m de um aliado não-incapacitado que também use escudo.',
      },
    ],
    attacks: [
      {
        name: 'Lança',
        mode: 'melee',
        attribute: 'for',
        hitBonus: 4,
        reach: '1,5m',
        damage: { dice: '1d6', bonus: 2 },
        damageType: 'perfurante',
      },
      {
        name: 'Espada Curta (Ferro)',
        mode: 'melee',
        attribute: 'for',
        hitBonus: 4,
        reach: '1,5m',
        damage: { dice: '1d6', bonus: 2 },
        damageType: 'cortante',
      },
    ],
    details: {
      speed: '9 m',
      proficiencies: 'Atletismo +4',
      senses: 'Percepção passiva 10',
      challenge: '1/2 (100 XP)',
    },
  },
  {
    id: 'enemy-preset-general-de-guerra',
    name: 'General de Guerra',
    nameGender: 'm',
    description: 'Líder tático que pode comandar aliados a atacar com reação.',
    creatureType: 'Médio, Humano, Leal e Neutro/Mau',
    hitDice: { count: 8, sides: 8, bonus: 16 },
    hp: 52,
    ca: 16,
    caSource: 'Peitoral de ferro, Escudo',
    attributes: { for: 16, des: 12, con: 14, int: 14, sab: 12, car: 15 },
    saveBonuses: { for: 5, con: 4 },
    abilities: [
      {
        name: 'Comandar Aliados',
        description:
          'Com uma ação bônus, o general pode ordenar que um aliado a até 9m dele faça um ataque com arma usando sua reação.',
      },
      { name: 'Ataques Múltiplos', description: 'O general faz dois ataques corporais.' },
    ],
    attacks: [
      {
        name: 'Espada Longa',
        mode: 'melee',
        attribute: 'for',
        hitBonus: 5,
        reach: '1,5m',
        damage: { dice: '1d8', bonus: 3 },
        damageType: 'cortante',
      },
    ],
    details: {
      speed: '9 m',
      proficiencies: 'Atletismo +5, História +4, Intimidação +4',
      senses: 'Percepção passiva 11',
      challenge: '3 (700 XP)',
    },
  },
  {
    id: 'enemy-preset-leao-da-judeia',
    name: 'Leão da Judeia',
    nameGender: 'm',
    description: 'Fera com tática de matilha, salto e bote.',
    creatureType: 'Grande, Fera, Imparcial',
    hitDice: { count: 4, sides: 10, bonus: 4 },
    hp: 26,
    ca: 12,
    caSource: 'Armadura Natural',
    attributes: { for: 17, des: 15, con: 13, int: 3, sab: 12, car: 8 },
    abilities: [
      {
        name: 'Tática de Matilha',
        description:
          'O leão tem vantagem nas rolagens de ataque corpo a corpo contra uma criatura se houver pelo menos um aliado do leão a até 1,5m da criatura e este aliado não estiver incapacitado.',
      },
      {
        name: 'Salto e Bote',
        description:
          'Se o leão se mover pelo menos 6m em linha reta em direção a um alvo e, logo em seguida, acertar um ataque de garra no mesmo turno, o alvo deve ser bem sucedido num Teste de Resistência de Força CD 13 ou ficará caído. Se o alvo cair, o leão pode realizar um ataque de mordida contra ele usando uma Ação Bônus.',
        libraryId: 'enemy-salto-e-bote',
      },
    ],
    attacks: [
      {
        name: 'Mordida',
        mode: 'melee',
        attribute: 'for',
        hitBonus: 5,
        reach: '1,5m',
        damage: { dice: '1d8', bonus: 3 },
        damageType: 'perfurante',
      },
      {
        name: 'Garra',
        mode: 'melee',
        attribute: 'for',
        hitBonus: 5,
        reach: '1,5m',
        damage: { dice: '1d6', bonus: 3 },
        damageType: 'cortante',
      },
    ],
    details: {
      speed: '15 m',
      proficiencies: 'Furtividade +6, Percepção +3',
      senses: 'Percepção passiva 13',
      challenge: '1 (200 XP)',
    },
  },
];

export function findEnemyPreset(id: string | undefined): EnemyPresetDefinition | undefined {
  return ENEMY_PRESETS.find((preset) => preset.id === id);
}
