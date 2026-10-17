// CARACTERIZAÇÃO: fixa o comportamento ATUAL de cura e Fé dos consumíveis.
// Decisões: ROADMAP.md, Onda 2 (bloco B): Odre e Ração não curam (Sustento); Bálsamo cura 1d4 PV.
// Termos: CONTEXT.md (Sustento, Ração, Qualidade).
import { describe, expect, it } from 'vitest';
import { ITEMS_DB } from '@/data/itemsDb';
import { applyConsumableEffects, resolveHealing } from '@/domain/consumables';

describe('resolveHealing: de onde vem a cura', () => {
  it('usa os efeitos gravados no item quando existem', () => {
    expect(resolveHealing('1d6', undefined, 'Cura 1d4 PV', 1)).toEqual({ healDice: '1d6' });
    expect(resolveHealing(undefined, 5, 'Cura 1d4 PV', 1)).toEqual({ heal: 5 });
  });

  it('sem efeitos, lê a descrição do catálogo: dado ("Cura 1d4 PV")', () => {
    expect(resolveHealing(undefined, undefined, 'Cura 1d4 PV. 1 dia de nutrição', 1)).toEqual({
      healDice: '1d4',
    });
  });

  it('sem efeitos, lê a descrição do catálogo: valor fixo ("Cura 2 PV")', () => {
    expect(resolveHealing(undefined, undefined, 'Cura 2 PV. Sobrevivência', 1)).toEqual({
      heal: 2,
    });
  });

  it('aceita HP ou PV e ignora maiúsculas', () => {
    expect(resolveHealing(undefined, undefined, 'cura 1d4 hp em Descanso', 1)).toEqual({
      healDice: '1d4',
    });
  });

  it('descrição sem cura não dá cura', () => {
    expect(resolveHealing(undefined, undefined, 'Ilumina 6m. Queima por 1h', 1)).toEqual({});
    expect(resolveHealing(undefined, undefined, undefined, 1)).toEqual({});
  });

  it('o dado vence a cura fixa quando os dois existem', () => {
    expect(resolveHealing('1d4', 3, undefined, 1)).toEqual({ healDice: '1d4' });
  });
});

describe('resolveHealing: Qualidade do item', () => {
  it('cada nível acima de 1 avança um degrau no dado (1d4 -> 1d6 -> 1d8)', () => {
    expect(resolveHealing('1d4', undefined, undefined, 2)).toEqual({ healDice: '1d6' });
    expect(resolveHealing('1d4', undefined, undefined, 3)).toEqual({ healDice: '1d8' });
  });

  it('o dado para no último degrau (3d12)', () => {
    expect(resolveHealing('1d4', undefined, undefined, 99)).toEqual({ healDice: '3d12' });
  });

  it('dado fora da tabela não muda de nível', () => {
    expect(resolveHealing('5d5', undefined, undefined, 4)).toEqual({ healDice: '5d5' });
  });

  it('cura fixa soma +2 por nível acima de 1', () => {
    expect(resolveHealing(undefined, 2, undefined, 1)).toEqual({ heal: 2 });
    expect(resolveHealing(undefined, 2, undefined, 3)).toEqual({ heal: 6 });
  });

  it('nível menor que 1 não reduz', () => {
    expect(resolveHealing('1d4', undefined, undefined, 0)).toEqual({ healDice: '1d4' });
  });
});

describe('resolveHealing: itens do catálogo hoje', () => {
  const healing = (name: string) =>
    resolveHealing(undefined, undefined, ITEMS_DB.find((i) => i.name === name)?.description, 1);

  it('Odre e Ração são Sustento: não curam', () => {
    expect(healing('Odre (Água)')).toEqual({});
    expect(healing('Ração de Viagem')).toEqual({});
  });

  it('Bálsamo: o texto "Cura 1d4 HP em Descanso" vira dado de cura', () => {
    expect(healing('Bálsamo Curativo / Óleo')).toEqual({ healDice: '1d4' });
  });

  it('itens que não curam não têm cura', () => {
    expect(healing('Tocha')).toEqual({});
  });
});

describe('applyConsumableEffects', () => {
  it('cura fixa soma ao PV atual e não passa do máximo', () => {
    const r = applyConsumableEffects({ pv: 20, current_pv: 15 }, { heal: 3 });
    expect(r.stats.current_pv).toBe(18);
    expect(applyConsumableEffects({ pv: 20, current_pv: 19 }, { heal: 3 }).stats.current_pv).toBe(
      20,
    );
  });

  it('sem PV atual gravado, parte do PV máximo', () => {
    expect(applyConsumableEffects({ pv: 20 }, { heal: 5 }).stats.current_pv).toBe(20);
  });

  it('restaurar Fé não passa da Fé Inicial gravada', () => {
    expect(
      applyConsumableEffects({ faith: 50, current_faith: 45 }, { restore_faith: 10 }).stats
        .current_faith,
    ).toBe(50);
  });

  it('BUG conhecido: sem Fé Inicial gravada, a Fé restaurada vira 0 (teto 0)', () => {
    expect(
      applyConsumableEffects({ current_faith: 10 }, { restore_faith: 5 }).stats.current_faith,
    ).toBe(0);
  });

  it('só marca mudança quando há cura ou Fé', () => {
    expect(applyConsumableEffects({ pv: 10 }, {}).hasChanges).toBe(false);
    expect(applyConsumableEffects({ pv: 10 }, { heal: 0 }).hasChanges).toBe(false);
    expect(applyConsumableEffects({ pv: 10 }, { heal: 1 }).hasChanges).toBe(true);
    expect(applyConsumableEffects({ faith: 50 }, { restore_faith: 1 }).hasChanges).toBe(true);
  });

  it('o dado de cura (heal_dice) é ignorado: nada o rola', () => {
    const r = applyConsumableEffects({ pv: 20, current_pv: 5 }, { heal_dice: '1d4' } as never);
    expect(r.stats.current_pv).toBe(5);
    expect(r.hasChanges).toBe(false);
  });

  it('não altera as stats recebidas', () => {
    const stats = { pv: 20, current_pv: 5 };
    applyConsumableEffects(stats, { heal: 3 });
    expect(stats.current_pv).toBe(5);
  });
});
