// A luz do mapa (CONTEXT.md: Ambiente, Luz plena, Penumbra, Escuridão, Fonte de luz; regras-base 6.7).
// A luz é um círculo: a distância é a euclidiana entre o centro dos Quadrados, em metros.
import { describe, expect, it } from 'vitest';
import {
  ambientForPeriod,
  effectiveAmbient,
  isSeen,
  lightLevelAt,
  type LightSource,
} from './light';

const torch = (col: number, row: number, brightM = 6, dimM = 6): LightSource => ({
  cell: { col, row },
  brightM,
  dimM,
});

describe('ambientForPeriod', () => {
  it('manhã e tarde são claras; a noite é escura', () => {
    expect(ambientForPeriod('Manhã')).toBe('claro');
    expect(ambientForPeriod('Tarde')).toBe('claro');
    expect(ambientForPeriod('Noite')).toBe('escuridao');
  });

  it('período desconhecido ou ausente é claro (como a Manhã que o relógio assume)', () => {
    expect(ambientForPeriod(null)).toBe('claro');
    expect(ambientForPeriod('Madrugada')).toBe('claro');
  });
});

describe('effectiveAmbient', () => {
  it('o Ambiente que o Mestre fixou vale mais que o período', () => {
    expect(effectiveAmbient('penumbra', 'Manhã')).toBe('penumbra');
    expect(effectiveAmbient('claro', 'Noite')).toBe('claro');
    expect(effectiveAmbient('escuridao', 'Tarde')).toBe('escuridao');
  });

  it('sem Ambiente fixado, segue o período', () => {
    expect(effectiveAmbient(null, 'Noite')).toBe('escuridao');
    expect(effectiveAmbient(null, 'Manhã')).toBe('claro');
  });

  it('valor desconhecido gravado no banco não conta como fixado', () => {
    expect(effectiveAmbient('noite', 'Noite')).toBe('escuridao');
  });
});

describe('lightLevelAt: sem fontes de luz, vale o Ambiente', () => {
  it('claro é Luz plena em todo lugar', () => {
    expect(lightLevelAt({ col: 3, row: 3 }, 'claro', [])).toBe('plena');
  });

  it('Penumbra e Escuridão valem em todo lugar', () => {
    expect(lightLevelAt({ col: 3, row: 3 }, 'penumbra', [])).toBe('penumbra');
    expect(lightLevelAt({ col: 3, row: 3 }, 'escuridao', [])).toBe('escuridao');
  });
});

describe('lightLevelAt: a Tocha (6 m de Luz plena e mais 6 m de Penumbra)', () => {
  const sources = [torch(10, 10)];
  // Um Quadrado vale 1,5 m: 6 m são 4 Quadrados; 12 m, 8.
  const at = (col: number, row = 10) => lightLevelAt({ col, row }, 'escuridao', sources);

  it('no próprio Quadrado da fonte é Luz plena', () => {
    expect(at(10)).toBe('plena');
  });

  it('até 6 m (4 Quadrados) é Luz plena, no limite exato inclusive', () => {
    expect(at(13)).toBe('plena');
    expect(at(14)).toBe('plena');
  });

  it('logo depois de 6 m começa a Penumbra', () => {
    expect(at(15)).toBe('penumbra');
  });

  it('até 12 m (8 Quadrados) é Penumbra, no limite exato inclusive', () => {
    expect(at(18)).toBe('penumbra');
  });

  it('depois de 12 m é Escuridão', () => {
    expect(at(19)).toBe('escuridao');
  });

  it('a luz é um círculo: a diagonal pesa mais que a reta', () => {
    // (3, 3) de distância: sqrt(18) × 1,5 m ≈ 6,36 m, já na Penumbra; a reta de 4 Quadrados, não.
    expect(lightLevelAt({ col: 13, row: 13 }, 'escuridao', sources)).toBe('penumbra');
    expect(lightLevelAt({ col: 14, row: 10 }, 'escuridao', sources)).toBe('plena');
    // (2, 2): sqrt(8) × 1,5 ≈ 4,24 m, ainda Luz plena.
    expect(lightLevelAt({ col: 12, row: 12 }, 'escuridao', sources)).toBe('plena');
  });

  it('funciona para cima e para a esquerda também', () => {
    expect(lightLevelAt({ col: 6, row: 10 }, 'escuridao', sources)).toBe('plena');
    expect(lightLevelAt({ col: 10, row: 2 }, 'escuridao', sources)).toBe('penumbra');
    expect(lightLevelAt({ col: 10, row: 1 }, 'escuridao', sources)).toBe('escuridao');
  });
});

describe('lightLevelAt: várias fontes e o Ambiente', () => {
  it('vale a melhor luz entre as fontes', () => {
    const sources = [torch(0, 0, 3, 3), torch(10, 0, 6, 0)];
    expect(lightLevelAt({ col: 9, row: 0 }, 'escuridao', sources)).toBe('plena');
    expect(lightLevelAt({ col: 3, row: 0 }, 'escuridao', sources)).toBe('penumbra');
    expect(lightLevelAt({ col: 5, row: 0 }, 'escuridao', sources)).toBe('escuridao');
  });

  it('a luz nunca escurece o Ambiente: em Penumbra, fora da luz continua Penumbra', () => {
    expect(lightLevelAt({ col: 30, row: 30 }, 'penumbra', [torch(0, 0)])).toBe('penumbra');
    expect(lightLevelAt({ col: 1, row: 0 }, 'penumbra', [torch(0, 0)])).toBe('plena');
  });

  it('em Ambiente claro, a fonte não muda nada', () => {
    expect(lightLevelAt({ col: 30, row: 30 }, 'claro', [torch(0, 0)])).toBe('plena');
  });

  it('uma fonte só de Luz plena (sem Penumbra) corta seco no raio', () => {
    const fogueira = [torch(5, 5, 3, 0)];
    expect(lightLevelAt({ col: 7, row: 5 }, 'escuridao', fogueira)).toBe('plena');
    expect(lightLevelAt({ col: 8, row: 5 }, 'escuridao', fogueira)).toBe('escuridao');
  });

  it('uma fonte de raio zero ilumina só o próprio Quadrado', () => {
    expect(lightLevelAt({ col: 5, row: 5 }, 'escuridao', [torch(5, 5, 0, 0)])).toBe('plena');
    expect(lightLevelAt({ col: 6, row: 5 }, 'escuridao', [torch(5, 5, 0, 0)])).toBe('escuridao');
  });
});

describe('isSeen', () => {
  it('Luz plena e Penumbra se veem; Escuridão, não', () => {
    expect(isSeen('plena')).toBe(true);
    expect(isSeen('penumbra')).toBe(true);
    expect(isSeen('escuridao')).toBe(false);
  });
});
