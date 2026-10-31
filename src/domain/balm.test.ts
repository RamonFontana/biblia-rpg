// Bálsamo: cura o resultado do dado do item, só no Descanso Curto (CONTEXT.md, Bálsamo).
// Regras do autor em 2026-10-30: sem CON, sem teto por Descanso, só em si mesmo.
import { describe, expect, it } from 'vitest';
import {
  balmUseBlockMessage,
  getBalmDice,
  getBalmUseBlock,
  healWithBalm,
  isValidBalmRoll,
  rollBalm,
} from '@/domain/balm';
import { createSeededRng } from '@/domain/rng';

const DESCRIPTION = 'Cura 1d4 HP em Descanso';

describe('getBalmDice: o dado do item com a Qualidade', () => {
  it('Qualidade 1 rola 1d4', () => {
    expect(getBalmDice(DESCRIPTION, 1)).toBe('1d4');
  });

  it('cada nível de Qualidade sobe um degrau do dado', () => {
    expect(getBalmDice(DESCRIPTION, 2)).toBe('1d6');
    expect(getBalmDice(DESCRIPTION, 3)).toBe('1d8');
    expect(getBalmDice(DESCRIPTION, 5)).toBe('1d12');
  });

  it('Qualidade ausente vale 1', () => {
    expect(getBalmDice(DESCRIPTION, null)).toBe('1d4');
  });
});

describe('isValidBalmRoll: o resultado digitado', () => {
  it('com um dado, vai de 1 às faces', () => {
    expect(isValidBalmRoll(1, '1d4')).toBe(true);
    expect(isValidBalmRoll(4, '1d4')).toBe(true);
    expect(isValidBalmRoll(0, '1d4')).toBe(false);
    expect(isValidBalmRoll(5, '1d4')).toBe(false);
  });

  it('com vários dados, vai de N a N vezes as faces (a soma)', () => {
    expect(isValidBalmRoll(2, '2d6')).toBe(true);
    expect(isValidBalmRoll(12, '2d6')).toBe(true);
    expect(isValidBalmRoll(1, '2d6')).toBe(false);
    expect(isValidBalmRoll(13, '2d6')).toBe(false);
  });

  it('recusa o que não é inteiro', () => {
    expect(isValidBalmRoll(2.5, '1d4')).toBe(false);
    expect(isValidBalmRoll(Number.NaN, '1d4')).toBe(false);
  });
});

describe('rollBalm: o dado virtual', () => {
  it('sempre cai na faixa do dado e é reproduzível pela seed', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const roll = rollBalm('2d6', createSeededRng(seed));
      expect(isValidBalmRoll(roll, '2d6')).toBe(true);
      expect(rollBalm('2d6', createSeededRng(seed))).toBe(roll);
    }
  });
});

describe('healWithBalm: a cura', () => {
  it('cura o resultado, sem modificador de CON', () => {
    expect(healWithBalm({ roll: 3, currentPv: 5, maxPv: 20 })).toEqual({ newPv: 8, healed: 3 });
  });

  it('não passa do PV máximo e informa o que subiu de fato', () => {
    expect(healWithBalm({ roll: 4, currentPv: 18, maxPv: 20 })).toEqual({ newPv: 20, healed: 2 });
  });

  it('quem está com 0 PV (Estável) sobe a partir de 0', () => {
    expect(healWithBalm({ roll: 2, currentPv: 0, maxPv: 10 })).toEqual({ newPv: 2, healed: 2 });
  });
});

describe('getBalmUseBlock: por que não dá para usar agora', () => {
  const free = {
    restOpen: true,
    isDead: false,
    isDying: false,
    quantity: 2,
    currentPv: 5,
    maxPv: 20,
  };

  it('livre com o Descanso aberto, PV faltando e Bálsamo no inventário', () => {
    expect(getBalmUseBlock(free)).toBeNull();
  });

  it.each([
    ['closed', { restOpen: false }],
    ['dead', { isDead: true }],
    ['dying', { isDying: true }],
    ['none', { quantity: 0 }],
    ['full', { currentPv: 20 }],
  ] as const)('%s', (block, change) => {
    expect(getBalmUseBlock({ ...free, ...change })).toBe(block);
  });

  it('o Descanso fechado vem antes das outras razões', () => {
    expect(getBalmUseBlock({ ...free, restOpen: false, isDead: true, quantity: 0 })).toBe('closed');
  });

  it('cada razão tem uma mensagem em português', () => {
    expect(balmUseBlockMessage('closed')).toBe('Só no Descanso Curto.');
    expect(balmUseBlockMessage('none')).toBe('Sem Bálsamo no inventário.');
    expect(balmUseBlockMessage('full')).toBe('PV já está no máximo.');
    expect(balmUseBlockMessage('dead')).toBe('Personagem morto.');
    expect(balmUseBlockMessage('dying')).toBe('Morrendo: resolva os Testes de Morte antes.');
  });
});
