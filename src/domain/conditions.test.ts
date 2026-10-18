// CARACTERIZAÇÃO: fixa o comportamento ATUAL da lista de Condições de um personagem.
// Decisões: ROADMAP.md, Onda 2 (bloco B): Sangrando causa dano no FINAL do turno (hoje o dano
// nem é automático); novas Condições Impedido, Paralisado e Exausto.
// Termos: CONTEXT.md (Condição).
import { describe, expect, it } from 'vitest';
import {
  cleanTemporaryConditions,
  mergeCondition,
  removeCondition,
  tickConditions,
} from './conditions';

const c = (conditionId: string, duration: number | null) => ({ conditionId, duration });

describe('mergeCondition', () => {
  it('acrescenta uma condição nova ao fim', () => {
    expect(mergeCondition([c('sangrando', 3)], c('cego', 2))).toEqual([
      c('sangrando', 3),
      c('cego', 2),
    ]);
  });

  it('reaplicar a mesma condição substitui a anterior e reinicia a duração', () => {
    const result = mergeCondition([c('sangrando', 1), c('cego', 4)], c('sangrando', 3));
    expect(result).toEqual([c('cego', 4), c('sangrando', 3)]);
  });

  it('uma condição sem duração (até curar) pode ser trocada por uma temporária', () => {
    expect(mergeCondition([c('sangrando', null)], c('sangrando', 2))).toEqual([c('sangrando', 2)]);
  });

  it('não altera a lista recebida', () => {
    const current = [c('sangrando', 3)];
    mergeCondition(current, c('cego', 1));
    expect(current).toEqual([c('sangrando', 3)]);
  });
});

describe('removeCondition', () => {
  it('remove só a condição indicada', () => {
    expect(removeCondition([c('sangrando', 3), c('cego', 2)], 'sangrando')).toEqual([c('cego', 2)]);
  });

  it('remover uma condição que não existe não muda nada', () => {
    expect(removeCondition([c('cego', 2)], 'caido')).toEqual([c('cego', 2)]);
  });
});

describe('tickConditions: passagem de uma rodada', () => {
  it('diminui 1 de cada duração', () => {
    expect(tickConditions([c('cego', 3), c('sangrando', 2)])).toEqual([
      c('cego', 2),
      c('sangrando', 1),
    ]);
  });

  it('remove a condição que chega a 0', () => {
    expect(tickConditions([c('cego', 1), c('sangrando', 2)])).toEqual([c('sangrando', 1)]);
  });

  it('condição sem duração é permanente e não muda', () => {
    expect(tickConditions([c('sangrando', null)])).toEqual([c('sangrando', null)]);
  });

  it('BUG conhecido: não há dano de Sangrando; o tique só conta rodadas', () => {
    // O doc manda 1d4 no final do turno. Aqui só a duração diminui; o Mestre aplica o dano.
    const [bleeding] = tickConditions([c('sangrando', 3)]);
    expect(bleeding).toEqual(c('sangrando', 2));
  });

  it('não altera a lista recebida', () => {
    const current = [c('cego', 3)];
    tickConditions(current);
    expect(current).toEqual([c('cego', 3)]);
  });
});

describe('cleanTemporaryConditions: limpeza ao fim do combate', () => {
  it('mantém só as condições permanentes (sem duração)', () => {
    expect(cleanTemporaryConditions([c('sangrando', null), c('atordoado', 2)])).toEqual([
      c('sangrando', null),
    ]);
  });

  it('uma condição temporária, mesmo com muita duração, é removida', () => {
    expect(cleanTemporaryConditions([c('cego', 99)])).toEqual([]);
  });
});
