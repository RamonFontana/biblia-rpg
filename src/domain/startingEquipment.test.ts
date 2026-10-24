// CARACTERIZAÇÃO: a loja inicial da criação de personagem. O mesmo comportamento é fixado pela tela
// em features/character-creation/components/steps/EquipmentMerchant.test.tsx.
import { describe, expect, it } from 'vitest';
import { ITEMS_DB } from '@/content/items';
import { VOCATION_PROFICIENCIES } from '@/content/proficiencies';
import {
  STARTER_KIT_ID,
  STARTING_COINS,
  buyItem,
  buyStarterKit,
  canBuyItem,
  canBuyStarterKit,
  getStoreItems,
  hasStarterKit,
  sellItem,
  sellValue,
  startingCoins,
} from './startingEquipment';

const sword = { id: 'espada', name: 'Espada', type: 'Arma', cost: 10 };
const bread = { id: 'pao', name: 'Pão', type: 'Consumível', cost: 0.5 };
const kitRow = { id: STARTER_KIT_ID, name: 'Kit', type: 'Kit', cost: 50 };

describe('startingCoins', () => {
  it('usa as moedas gravadas, ou 50 quando não há ou são 0', () => {
    expect(startingCoins(31)).toBe(31);
    expect(startingCoins(undefined)).toBe(STARTING_COINS);
    expect(startingCoins(0)).toBe(STARTING_COINS);
    expect(STARTING_COINS).toBe(50);
  });
});

describe('buyItem e canBuyItem', () => {
  it('tira o preço da carteira e põe o item no fim da bolsa', () => {
    const purse = buyItem({ coins: 50, items: [bread] }, sword);
    expect(purse).toEqual({ coins: 40, items: [bread, sword] });
  });

  it('não altera a bolsa original', () => {
    const before = { coins: 50, items: [bread] };
    buyItem(before, sword);
    expect(before).toEqual({ coins: 50, items: [bread] });
  });

  it('com saldo exato compra; um centavo a menos não', () => {
    expect(buyItem({ coins: 10, items: [] }, sword).items).toEqual([sword]);
    const short = { coins: 9.99, items: [] };
    expect(buyItem(short, sword)).toBe(short);
  });

  it('item sem preço custa 0', () => {
    const free = { id: 'x', name: 'Graça', type: 'Utilidade' };
    expect(buyItem({ coins: 3, items: [] }, free)).toEqual({ coins: 3, items: [free] });
  });

  it('preços fracionados entram na conta sem arredondar', () => {
    expect(buyItem({ coins: 50, items: [] }, bread).coins).toBe(49.5);
  });

  it('canBuyItem exige saldo e a ausência do Pacote Inicial', () => {
    expect(canBuyItem({ coins: 10, items: [] }, sword)).toBe(true);
    expect(canBuyItem({ coins: 9, items: [] }, sword)).toBe(false);
    expect(canBuyItem({ coins: 100, items: [kitRow] }, sword)).toBe(false);
  });
});

describe('Pacote Inicial', () => {
  it('buyStarterKit troca a bolsa inteira pelo kit e deixa só a sobra na carteira', () => {
    expect(buyStarterKit({ name: 'Kit Básico de Guerreiro', leftover: 5 })).toEqual({
      coins: 5,
      items: [
        {
          id: 'kit_basico',
          name: 'Kit Básico de Guerreiro',
          type: 'Kit',
          cost: 50,
          description: 'Pacote inicial de equipamentos.',
        },
      ],
    });
  });

  it('só se pega com 50 Siclos ou mais', () => {
    expect(canBuyStarterKit(50)).toBe(true);
    expect(canBuyStarterKit(49.99)).toBe(false);
  });

  it('hasStarterKit reconhece a linha do kit pelo id', () => {
    expect(hasStarterKit([sword, kitRow])).toBe(true);
    expect(hasStarterKit([sword])).toBe(false);
  });
});

describe('sellItem e sellValue', () => {
  it('vender um item soma o preço e tira só aquela posição', () => {
    const purse = sellItem({ coins: 20, items: [sword, bread, sword] }, 2);
    expect(purse).toEqual({ coins: 30, items: [sword, bread] });
  });

  it('vender o kit devolve o custo gravado nele, não soma à carteira', () => {
    expect(sellItem({ coins: 5, items: [kitRow] }, 0)).toEqual({ coins: 50, items: [] });
  });

  // Decisão do autor (ROADMAP, passo 9d, Q15b): a venda do kit devolve o `cost` da linha. Antes
  // devolvia 50 fixos; hoje os dois valem 50, então só um kit com outro custo mostra a diferença.
  it('o kit com outro custo gravado devolve esse custo', () => {
    expect(sellItem({ coins: 5, items: [{ ...kitRow, cost: 40 }] }, 0)).toEqual({
      coins: 40,
      items: [],
    });
  });

  it('o kit sem custo gravado (rascunho antigo) devolve os 50 Siclos iniciais', () => {
    const { cost, ...withoutCost } = kitRow;
    void cost;
    expect(sellItem({ coins: 5, items: [withoutCost] }, 0)).toEqual({ coins: 50, items: [] });
  });

  it('item sem preço devolve 0', () => {
    const free = { id: 'x', name: 'Graça', type: 'Utilidade' };
    expect(sellItem({ coins: 7, items: [free] }, 0)).toEqual({ coins: 7, items: [] });
  });

  it('posição que não existe não muda nada', () => {
    expect(sellItem({ coins: 7, items: [sword] }, 3)).toEqual({ coins: 7, items: [sword] });
  });

  it('sellValue mostra o que a venda devolve', () => {
    expect(sellValue(sword)).toBe(10);
    expect(sellValue(kitRow)).toBe(50);
    // O kit devolve o `cost` gravado na linha, como qualquer item.
    expect(sellValue({ ...kitRow, cost: 12 })).toBe(12);
  });
});

describe('getStoreItems', () => {
  it('lista só categorias que a Vocação sabe usar', () => {
    const items = getStoreItems('Batedor');
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(VOCATION_PROFICIENCIES.Batedor).toContain(item.category);
    expect(items.some((i) => i.category === 'Pesada')).toBe(false);
  });

  it('Vocação desconhecida vê só a categoria "Todas"', () => {
    const items = getStoreItems('Nobre');
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.category === 'Todas')).toBe(true);
    expect(items).toHaveLength(ITEMS_DB.filter((i) => i.category === 'Todas').length);
  });
});
