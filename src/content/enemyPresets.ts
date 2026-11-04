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
  {
    id: 'enemy-preset-sentinela-amalequita',
    name: 'Sentinela Amalequita',
    nameGender: 'f',
    description: 'Batedores cruéis que atacam a retaguarda e disparam de pontos altos.',
    creatureType: 'Médio, Humano, Caótico e Mau',
    context: 'Batedores cruéis que atacam a retaguarda e disparam de pontos altos.',
    hitDice: { count: 3, sides: 8, bonus: 3 },
    hp: 16,
    ca: 13,
    caSource: 'Couro leve',
    attributes: { for: 11, des: 14, con: 12, int: 10, sab: 12, car: 9 },
    abilities: [
      {
        name: 'Ataque Furtivo de Emboscada',
        description:
          'No primeiro turno do combate, tem Vantagem em ataques contra alvos que ainda não agiram.',
      },
    ],
    attacks: [
      {
        name: 'Arco Curto',
        mode: 'ranged',
        attribute: 'des',
        hitBonus: 4,
        reach: '24/96m',
        damage: { dice: '1d6', bonus: 2 },
        damageType: 'perfurante',
      },
      {
        name: 'Faca de Osso',
        mode: 'melee',
        attribute: 'finesse',
        hitBonus: 4,
        reach: '1,5m',
        damage: { dice: '1d4', bonus: 2 },
        damageType: 'perfurante',
      },
    ],
    details: {
      speed: '9 m',
      proficiencies: 'Percepção +3, Sobrevivência +3',
      senses: 'Percepção passiva 13',
      challenge: '1/4 (50 XP)',
    },
  },
  {
    id: 'enemy-preset-sacerdote-de-baal',
    name: 'Sacerdote de Baal',
    nameGender: 'm',
    description: 'Líder herege que invoca maldições demoníacas para enfraquecer a Fé dos heróis.',
    creatureType: 'Médio, Humano, Neutro e Mau',
    context: 'Líder herege que invoca maldições demoníacas para enfraquecer a Fé dos heróis.',
    hitDice: { count: 6, sides: 8, bonus: 6 },
    hp: 33,
    ca: 12,
    caSource: 'Vestes cerimoniais',
    attributes: { for: 10, des: 14, con: 12, int: 13, sab: 16, car: 14 },
    saveBonuses: { sab: 5 },
    abilities: [
      {
        name: 'Aura de Heresia',
        description: 'Alvos a até 6m têm Desvantagem em testes para resistir a Amedrontado.',
      },
      {
        name: 'Maldição de Baal (Recarga 5-6)',
        description:
          'Um alvo a até 18 m faz um TR de Sabedoria CD 13 ou perde 1d6 de Fé. O dano psíquico (3d6, metade no sucesso) fica com o Mestre.',
        libraryId: 'enemy-maldicao-de-baal',
      },
    ],
    attacks: [
      {
        name: 'Adaga Cerimonial',
        mode: 'melee',
        attribute: 'finesse',
        hitBonus: 4,
        reach: '1,5m',
        damage: { dice: '1d4', bonus: 2 },
        damageType: 'perfurante',
        extra: 'Mais 3 (1d6) de dano psíquico.',
      },
    ],
    details: {
      speed: '9 m',
      proficiencies: 'Enganação +4, Religião +3',
      senses: 'Percepção passiva 13',
      challenge: '2 (450 XP)',
    },
  },
  {
    id: 'enemy-preset-vibora-do-deserto',
    name: 'Víbora do Deserto',
    nameGender: 'f',
    description: 'Serpente peçonhenta que ataca de surpresa.',
    creatureType: 'Miúdo, Fera, Imparcial',
    hitDice: { count: 1, sides: 4, bonus: 0 },
    hp: 2,
    ca: 13,
    caSource: 'Armadura Natural',
    attributes: { for: 2, des: 16, con: 11, int: 1, sab: 10, car: 3 },
    abilities: [
      {
        name: 'Bote Surpresa',
        description: 'Tem vantagem nas rolagens de ataque contra criaturas surpresas.',
      },
    ],
    attacks: [
      {
        name: 'Mordida Peçonhenta',
        mode: 'melee',
        attribute: 'des',
        hitBonus: 5,
        reach: '1,5m',
        damage: { bonus: 1 },
        damageType: 'perfurante',
        extra:
          'O alvo faz um TR de Constituição CD 10 ou sofre 5 (2d4) de dano de veneno (metade em caso de sucesso).',
      },
    ],
    details: {
      speed: '9 m, Natação 9 m',
      proficiencies: 'Furtividade +5',
      senses: 'Visão no escuro 3 m, Percepção passiva 10',
      challenge: '1/8 (25 XP)',
    },
  },
  {
    id: 'enemy-preset-urso-pardo-sirio',
    name: 'Urso Pardo Sírio',
    nameGender: 'm',
    description: 'Fera das florestas de Betel, forte e territorial.',
    creatureType: 'Grande, Fera, Imparcial',
    hitDice: { count: 4, sides: 10, bonus: 12 },
    hp: 34,
    ca: 11,
    caSource: 'Armadura Natural',
    attributes: { for: 19, des: 10, con: 16, int: 2, sab: 13, car: 7 },
    abilities: [
      {
        name: 'Faro Aguçado',
        description:
          'O urso tem vantagem em testes de Sabedoria (Percepção) que dependam do olfato.',
      },
      {
        name: 'Ataques Múltiplos',
        description: 'O urso faz dois ataques: um com sua mordida e um com suas garras.',
      },
    ],
    attacks: [
      {
        name: 'Mordida',
        mode: 'melee',
        attribute: 'for',
        hitBonus: 6,
        reach: '1,5m',
        damage: { dice: '1d8', bonus: 4 },
        damageType: 'perfurante',
      },
      {
        name: 'Garras',
        mode: 'melee',
        attribute: 'for',
        hitBonus: 6,
        reach: '1,5m',
        damage: { dice: '2d6', bonus: 4 },
        damageType: 'cortante',
      },
    ],
    details: {
      speed: '12 m, Escalada 9 m',
      proficiencies: 'Percepção +3',
      senses: 'Percepção passiva 13',
      challenge: '1 (200 XP)',
    },
  },
  {
    id: 'enemy-preset-guerreiro-anakim',
    name: 'Guerreiro Anakim',
    nameGender: 'm',
    description: 'Gigante descendente de Anaque, como Golias, de proporções aterrorizantes.',
    creatureType: 'Enorme, Humanoide (Gigante), Leal e Mau',
    hitDice: { count: 9, sides: 12, bonus: 27 },
    hp: 85,
    ca: 15,
    caSource: 'Cota de malha pesada adaptada, Desvantagem em Furtividade',
    attributes: { for: 21, des: 10, con: 16, int: 10, sab: 10, car: 12 },
    saveBonuses: { for: 7, con: 5 },
    abilities: [
      {
        name: 'Presença Aterradora',
        description:
          'Criatura hostil a até 9 m que veja o Anakim faz um TR de Sabedoria CD 13 ou fica Amedrontada por 1 minuto.',
        libraryId: 'enemy-presenca-aterradora',
      },
      {
        name: 'Resistência Opressora',
        description:
          'Armas comuns parecem não penetrar fundo. Ele subtrai 3 pontos de qualquer dano contundente, cortante ou perfurante não-crítico que sofra.',
      },
      {
        name: 'Ataques Múltiplos',
        description: 'O Anakim faz dois ataques com sua lança ou espada imensa.',
      },
    ],
    attacks: [
      {
        name: 'Lança Imensa',
        mode: 'melee',
        attribute: 'for',
        hitBonus: 7,
        reach: '3m',
        damage: { dice: '2d8', bonus: 5 },
        damageType: 'perfurante',
      },
      {
        name: 'Espada Pesada de Ferro',
        mode: 'melee',
        attribute: 'for',
        hitBonus: 7,
        reach: '1,5m',
        damage: { dice: '2d10', bonus: 5 },
        damageType: 'cortante',
      },
      {
        name: 'Arremesso de Rocha / Dardo Gigante',
        mode: 'ranged',
        attribute: 'for',
        hitBonus: 7,
        reach: '18/54m',
        damage: { dice: '3d6', bonus: 5 },
        damageType: 'concussão ou perfurante',
      },
    ],
    details: {
      speed: '12 m',
      proficiencies: 'Atletismo +7, Intimidação +5',
      senses: 'Percepção passiva 10',
      challenge: '5 (1800 XP)',
    },
  },
  {
    id: 'enemy-preset-endemoniado-comum',
    name: 'Endemoniado Comum',
    nameGender: 'm',
    description: 'Um homem levado à loucura pela entidade que o habita. Já vem com o Template.',
    creatureType: 'Médio, Humano (Sobrenatural), Caótico e Mau',
    context:
      'Um homem levado à loucura, cujos ossos e músculos foram torcidos pela entidade que o habita.',
    hitDice: { count: 4, sides: 8, bonus: 12 },
    hp: 30,
    ca: 12,
    caSource: 'Couro cru rasgado',
    attributes: { for: 15, des: 12, con: 16, int: 6, sab: 10, car: 10 },
    conditionImmunities: ['amedrontado'],
    abilities: [
      {
        name: 'Fúria Desumana',
        description:
          'O endemoniado ignora dores mortais. Quando cair a 0 PV, faz um Teste de Constituição (CD 10). Se passar, sobrevive com 1 PV. O CD aumenta em 5 a cada uso.',
      },
      {
        name: 'Ataque Furtivo',
        description:
          'Uma vez por turno, causa 1d6 de dano extra se tiver vantagem no ataque ou aliado a 1,5m do alvo.',
      },
      {
        name: 'Vulnerabilidade Espiritual',
        description: 'Vulnerável a orações e rituais de Fé.',
      },
      {
        name: 'Grito Atormentador (Recarga 5-6)',
        description:
          'Quem ouvir a até 9 m faz um TR de Sabedoria CD 12 ou perde 1d4 de Fé e sofre Desvantagem na próxima jogada de ataque.',
        libraryId: 'enemy-grito-atormentador',
      },
    ],
    attacks: [
      {
        name: 'Ataque Bestial (Garras/Mordida)',
        mode: 'melee',
        attribute: 'for',
        hitBonus: 4,
        reach: '1,5m',
        damage: { dice: '1d6', bonus: 2 },
        damageType: 'perfurante',
      },
    ],
    details: {
      speed: '9 m',
      proficiencies: 'Furtividade +3, Intimidação +2',
      senses: 'Percepção passiva 10',
      challenge: '2 (450 XP)',
    },
  },
];

export function findEnemyPreset(id: string | undefined): EnemyPresetDefinition | undefined {
  return ENEMY_PRESETS.find((preset) => preset.id === id);
}
