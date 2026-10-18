// CA (CONTEXT.md): sem armadura, 10 + DES; armadura leve soma a DES inteira, média até +2, pesada
// nenhuma; escudo dá +2; Qualidade soma +1 por nível acima de 1 em armadura e escudo; elmo não dá CA.
// Decisões: ROADMAP.md, Onda 3 (passo 5); ADR 0002 (Qualidade não é magia).
import { describe, expect, it } from 'vitest';
import { calculateArmorClass, formatItemArmorClass, getItemArmorClass } from './armorClass';

const ac = (
  dex: number,
  body?: string,
  shield?: string,
  levels: { body?: number; shield?: number } = {},
) =>
  calculateArmorClass({
    dexModifier: dex,
    body: body ? { slug: body, level: levels.body } : null,
    shield: shield ? { slug: shield, level: levels.shield } : null,
  });

describe('calculateArmorClass: sem armadura', () => {
  it('é 10 + modificador de DES, inclusive negativo', () => {
    expect(ac(3).total).toBe(13);
    expect(ac(0).total).toBe(10);
    expect(ac(-2).total).toBe(8);
  });
});

describe('calculateArmorClass: peso da armadura e a DES', () => {
  it('leve soma a DES inteira (Couro Cru: 11 + DES)', () => {
    expect(ac(2, 'couro_cru').total).toBe(13);
    expect(ac(5, 'couro_cru').total).toBe(16);
    expect(ac(-1, 'couro_cru').total).toBe(10);
  });

  it('a Túnica Sagrada conta como leve', () => {
    expect(ac(3, 'tunica_sagrada').total).toBe(14);
  });

  it('média soma a DES até +2 (Cota de Escamas: 14 + DES, máx +2)', () => {
    expect(ac(1, 'cota_escamas').total).toBe(15);
    expect(ac(2, 'cota_escamas').total).toBe(16);
    expect(ac(4, 'cota_escamas').total).toBe(16);
  });

  it('média com DES negativa subtrai (o teto é só para cima)', () => {
    expect(ac(-1, 'cota_escamas').total).toBe(13);
  });

  it('pesada ignora a DES (Cota de Malha: 14; Lorica: 16)', () => {
    expect(ac(4, 'cota_malha').total).toBe(14);
    expect(ac(-2, 'lorica').total).toBe(16);
  });
});

describe('calculateArmorClass: escudo e Qualidade', () => {
  it('o escudo soma +2 à CA da armadura ou à base', () => {
    expect(ac(2, undefined, 'escudo').total).toBe(14);
    expect(ac(2, 'couro_cru', 'escudo').total).toBe(15);
  });

  it('cada nível de Qualidade acima de 1 soma +1 na armadura e no escudo', () => {
    expect(ac(2, 'couro_cru', undefined, { body: 3 }).total).toBe(13 + 2);
    expect(ac(0, undefined, 'escudo', { shield: 4 }).total).toBe(10 + 2 + 3);
    expect(ac(0, 'lorica', undefined, { body: 5 }).total).toBe(16 + 4);
  });

  it('nível ausente, nulo ou 1 não soma nada', () => {
    expect(ac(0, 'couro_cru', undefined, { body: undefined }).total).toBe(11);
    expect(ac(0, 'couro_cru', undefined, { body: 1 }).total).toBe(11);
  });
});

describe('calculateArmorClass: o que não dá CA', () => {
  it('elmo não dá CA, nem com Qualidade', () => {
    expect(ac(1, 'elmo_bronze', undefined, { body: 5 }).total).toBe(11);
    expect(ac(1, 'chapeu_couro').total).toBe(11);
  });

  it('item que não é armadura no slot do corpo, ou arma no do escudo, é ignorado', () => {
    expect(ac(0, 'espada_curta').total).toBe(10);
    expect(ac(0, 'escudo').total).toBe(10);
    expect(ac(0, undefined, 'couro_cru').total).toBe(10);
    expect(ac(0, undefined, 'espada_curta').total).toBe(10);
  });

  it('slug desconhecido ou ausente não dá CA', () => {
    expect(ac(1, 'nao_existe').total).toBe(11);
    expect(
      calculateArmorClass({ dexModifier: 1, body: { slug: null }, shield: { slug: undefined } })
        .total,
    ).toBe(11);
  });
});

describe('calculateArmorClass: partes da conta', () => {
  it('base é 10 + DES e o bônus é o que a armadura e o escudo acrescentam', () => {
    const result = ac(2, 'cota_escamas', 'escudo');
    expect(result).toEqual({ total: 18, base: 12, bonus: 4 + 2 }); // 14 + 2 (DES) + 2 (escudo)
  });

  it('o bônus pode ser negativo: pesada com DES alta fica abaixo da base', () => {
    expect(ac(5, 'cota_malha')).toEqual({ total: 14, base: 15, bonus: -1 });
  });
});

describe('getItemArmorClass e formatItemArmorClass: o que o item mostra', () => {
  it('armadura mostra o valor do item e a regra da DES', () => {
    expect(formatItemArmorClass({ slug: 'couro_cru' })).toBe('CA 11 + DES');
    expect(formatItemArmorClass({ slug: 'cota_escamas' })).toBe('CA 14 + DES (máx +2)');
    expect(formatItemArmorClass({ slug: 'lorica' })).toBe('CA 16');
  });

  it('a Qualidade entra no valor do item', () => {
    expect(formatItemArmorClass({ slug: 'couro_batido', level: 3 })).toBe('CA 14 + DES');
    expect(formatItemArmorClass({ slug: 'escudo', level: 2 })).toBe('CA +3');
  });

  it('escudo mostra o bônus', () => {
    expect(formatItemArmorClass({ slug: 'escudo' })).toBe('CA +2');
  });

  it('elmo, arma, consumível e desconhecido não mostram CA', () => {
    for (const slug of ['elmo_bronze', 'chapeu_couro', 'espada_curta', 'tocha', 'nao_existe']) {
      expect(formatItemArmorClass({ slug })).toBeNull();
      expect(getItemArmorClass({ slug })).toBeNull();
    }
  });
});
