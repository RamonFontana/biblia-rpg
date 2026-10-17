// CARACTERIZAÇÃO: fixa o comportamento ATUAL dos Descansos Curto e Longo.
// Decisões: ROADMAP.md, Onda 2 (bloco B): Longo 1 por dia; Curto recarrega sem cura; Sustento.
// Termos: CONTEXT.md (Descanso Curto, Descanso Longo, Sustento).
import { describe, expect, it } from 'vitest';
import {
  applyLongRestToStats,
  calculateFaithRecovery,
  canTakeLongRest,
  canTakeShortRest,
  hasPriestInGroup,
  shouldApplyShortRestToCharacters,
} from './rest';

describe('Descanso Curto', () => {
  it('permite até 2 por dia', () => {
    expect(canTakeShortRest(0)).toBe(true);
    expect(canTakeShortRest(1)).toBe(true);
    expect(canTakeShortRest(2)).toBe(false);
  });

  it('BUG conhecido: sem informar PV recuperados, nem cura nem recarrega habilidades', () => {
    // O Mestre digita quantos PV o grupo recupera; com 0 (ou em branco) nada é aplicado,
    // inclusive a recarga das habilidades de Descanso Curto.
    expect(shouldApplyShortRestToCharacters(0)).toBe(false);
    expect(shouldApplyShortRestToCharacters(1)).toBe(true);
  });
});

describe('Descanso Longo: quando é permitido', () => {
  it('exige 2 dias de jogo desde o último (decisão: passa a ser 1 por dia)', () => {
    expect(canTakeLongRest(2, 1)).toBe(false);
    expect(canTakeLongRest(3, 1)).toBe(true);
    expect(canTakeLongRest(5, 3)).toBe(true);
  });

  it('no primeiro dia, com o padrão do banco (dia 1, último no dia 1), não é permitido', () => {
    expect(canTakeLongRest(1, 1)).toBe(false);
  });
});

describe('Descanso Longo: Fé recuperada pelo grupo', () => {
  it('sem Sacerdote, o 1d4 rolado', () => {
    expect(calculateFaithRecovery(3, false)).toBe(3);
  });

  it('com Sacerdote, o 1d4 mais 2', () => {
    expect(calculateFaithRecovery(3, true)).toBe(5);
  });

  it('reconhece Sacerdote e Sábio pelo texto, com maiúscula', () => {
    expect(hasPriestInGroup(['Guerreiro', 'Sacerdote'])).toBe(true);
    expect(hasPriestInGroup(['Guerreiro', 'Sábio'])).toBe(true);
    expect(hasPriestInGroup(['Guerreiro', 'Batedor'])).toBe(false);
    expect(hasPriestInGroup(['sacerdote'])).toBe(false);
  });

  it('personagem sem vocação não conta', () => {
    expect(hasPriestInGroup([undefined, null])).toBe(false);
  });
});

describe('Descanso Longo: efeito na ficha', () => {
  it('recupera todos os PV', () => {
    const result = applyLongRestToStats({ pv: 30, current_pv: 5, current_faith: 40 }, 3);
    expect(result.current_pv).toBe(30);
  });

  it('sem PV máximo gravado, enche até o padrão de 10', () => {
    expect(applyLongRestToStats({ current_pv: 1 }, 0).current_pv).toBe(10);
  });

  it('soma a Fé à Fé Atual', () => {
    expect(applyLongRestToStats({ pv: 10, current_faith: 40 }, 3).current_faith).toBe(43);
  });

  it('sem Fé Atual, parte da Fé Inicial gravada', () => {
    expect(applyLongRestToStats({ pv: 10, faith: 50 }, 2).current_faith).toBe(52);
  });

  it('BUG conhecido: o teto de Fé é 100 para todos, não a Fé Inicial do personagem', () => {
    expect(applyLongRestToStats({ pv: 10, current_faith: 99 }, 5).current_faith).toBe(100);
    expect(applyLongRestToStats({ pv: 10, faith: 50, current_faith: 50 }, 4).current_faith).toBe(
      54,
    );
  });

  it('preserva os outros campos e não altera o objeto recebido', () => {
    const stats = { pv: 10, current_faith: 10, ca: 12, status: 'Vivo' };
    const result = applyLongRestToStats(stats, 1);
    expect(result).toMatchObject({ ca: 12, status: 'Vivo' });
    expect(stats.current_faith).toBe(10);
  });
});
