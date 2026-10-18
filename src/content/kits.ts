// Kits iniciais por Vocação: o texto exibido na criação de personagem e os itens que o
// syncInventory grava no inventário, numa definição só. O Sábio usa o kit do Sacerdote.
import type { Kit } from './schemas';

const SACERDOTE_KIT: Kit = {
  name: 'Kit Básico de Sacerdote/Sábio',
  cost: 50,
  leftover: 12,
  markdown: `### Sacerdote / Sábio\nOs dois ofícios usam o mesmo pacote.\n- Cajado de pastor (1d6 concussão).\n- 3 Bálsamos curativos (cada um cura 1d4 PV).\n- 12 Shekels de prata no bolso (representando dízimos iniciais).\n- Itens de cena, sem efeito de regra: veste de linho fino com o Éfode, óleo de unção e incenso, instrumento musical (harpa, shofar ou tamborim) para o Sacerdote; manto de linho grosso, sandálias, pergaminhos, tinta e pena para o Sábio.`,
  items: [{ slug: 'cajado' }, { slug: 'balsamo', quantity: 3 }],
};

export const KITS_DB: Record<string, Kit> = {
  Guerreiro: {
    name: 'Kit Básico de Guerreiro',
    cost: 50,
    leftover: 5,
    markdown: `### Guerreiro\n- Espada curta de ferro (1d6 cortante).\n- Armadura de couro cru (CA 11 + Mod Des) e um escudo de madeira (+2 CA).\n- 5 rações de viagem e um odre de água (o Sustento dos primeiros Descansos Longos).\n- Uma faca de bronze (1d4 perfurante) e 5 Shekels de prata no bolso.`,
    items: [
      { slug: 'espada_curta' },
      { slug: 'couro_cru' },
      { slug: 'escudo' },
      { slug: 'racao', quantity: 5 },
      { slug: 'odre' },
      { slug: 'adaga' },
    ],
  },
  Caçador: {
    name: 'Kit Básico de Caçador/Nômade',
    cost: 50,
    leftover: 10,
    markdown: `### Caçador/Nômade\n- Arco curto (1d6 perfurante) com 20 flechas.\n- Faca de bronze (1d4 perfurante).\n- Armadura de couro cru (CA 11 + Mod Des).\n- Corda de cânhamo (15m) e 10 Shekels de prata no bolso.`,
    items: [
      { slug: 'arco_curto' },
      { slug: 'adaga' },
      { slug: 'couro_cru' },
      { slug: 'corda' },
      { slug: 'flechas', quantity: 20 },
    ],
  },
  Batedor: {
    name: 'Kit Básico de Batedor',
    cost: 50,
    leftover: 8,
    markdown: `### Batedor\n- Duas facas de bronze (1d4 perfurante).\n- Armadura de couro cru (CA 11 + Mod Des).\n- Corda de cânhamo (15m) e 8 Shekels de prata no bolso.`,
    items: [{ slug: 'adaga', quantity: 2 }, { slug: 'couro_cru' }, { slug: 'corda' }],
  },
  Sacerdote: SACERDOTE_KIT,
  Sábio: SACERDOTE_KIT,
};
