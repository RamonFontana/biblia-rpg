// CARACTERIZAÇÃO: o rolador de dados livre: abre zerado, troca o dado, rola com a animação e
// entrega o resultado, e ao reabrir esquece o resultado e a rolagem em andamento. O sorteio ainda
// usa Math.random direto (pendência já registrada no ROADMAP, passo 5a). Decisões: ROADMAP.md,
// Onda 4, passo 7b.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import { DiceRollerDialog } from './DiceRollerDialog';

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const open = (isOpen = true, onClose = vi.fn()) =>
  render(<DiceRollerDialog isOpen={isOpen} onClose={onClose} />);
const finishRoll = () => act(() => vi.advanceTimersByTime(3000));

describe('DiceRollerDialog', () => {
  it('fechado não desenha nada', () => {
    const { container } = open(false);
    expect(container.firstChild).toBeNull();
  });

  it('aberto, começa no d20, com "-" no lugar do resultado', () => {
    open();
    expect(screen.getByText('Rolador de Dados')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rolar d20' })).toBeTruthy();
    expect(screen.getByText('-')).toBeTruthy();
  });

  it('oferece d4, d6, d8, d10, d12, d20 e d100', () => {
    open();
    for (const die of [4, 6, 8, 10, 12, 20, 100]) {
      expect(screen.getByRole('button', { name: `d${die}` })).toBeTruthy();
    }
  });

  it('escolher um dado muda o botão de rolar', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'd6' }));
    expect(screen.getByRole('button', { name: 'Rolar d6' })).toBeTruthy();
  });

  it('rolar mostra "Rolando..." com os dados desligados e termina com o resultado do dado', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Rolar d20' }));
    expect(screen.getByRole('button', { name: 'Rolando...' })).toBeTruthy();
    expect((screen.getByRole('button', { name: 'd6' }) as HTMLButtonElement).disabled).toBe(true);
    finishRoll();
    expect(screen.getByRole('button', { name: 'Rolar d20' })).toBeTruthy();
    expect(screen.getByText('11')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'd6' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it.each([
    [4, 3],
    [6, 4],
    [100, 51],
  ])('o d%i com sorteio 0,5 dá %i', (die, expected) => {
    open();
    fireEvent.click(screen.getByRole('button', { name: `d${die}` }));
    fireEvent.click(screen.getByRole('button', { name: `Rolar d${die}` }));
    finishRoll();
    expect(screen.getByText(String(expected))).toBeTruthy();
  });

  it('o resultado fica entre 1 e o maior valor do dado', () => {
    (Math.random as unknown as ReturnType<typeof vi.fn>).mockReturnValue(0.999999);
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Rolar d20' }));
    finishRoll();
    expect(screen.getByText('20')).toBeTruthy();
    (Math.random as unknown as ReturnType<typeof vi.fn>).mockReturnValue(0);
    fireEvent.click(screen.getByRole('button', { name: 'Rolar d20' }));
    finishRoll();
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('trocar de dado limpa o resultado', () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Rolar d20' }));
    finishRoll();
    expect(screen.getByText('11')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'd8' }));
    expect(screen.getByText('-')).toBeTruthy();
  });

  it('o X chama onClose', () => {
    const onClose = vi.fn();
    open(true, onClose);
    fireEvent.click(screen.getByTitle('Fechar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fechar e reabrir esquece o resultado, mas lembra o dado escolhido', () => {
    const { rerender } = open();
    fireEvent.click(screen.getByRole('button', { name: 'd12' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rolar d12' }));
    finishRoll();
    expect(screen.getByText('7')).toBeTruthy();
    rerender(<DiceRollerDialog isOpen={false} onClose={vi.fn()} />);
    rerender(<DiceRollerDialog isOpen onClose={vi.fn()} />);
    expect(screen.getByText('-')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rolar d12' })).toBeTruthy();
  });

  it('fechar no meio da rolagem e reabrir devolve o botão de rolar', () => {
    const { rerender } = open();
    fireEvent.click(screen.getByRole('button', { name: 'Rolar d20' }));
    expect(screen.getByRole('button', { name: 'Rolando...' })).toBeTruthy();
    rerender(<DiceRollerDialog isOpen={false} onClose={vi.fn()} />);
    rerender(<DiceRollerDialog isOpen onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Rolar d20' })).toBeTruthy();
    expect(screen.getByText('-')).toBeTruthy();
  });

  it('sem fechar, rerenderizar aberto não zera o resultado', () => {
    const { rerender } = open();
    fireEvent.click(screen.getByRole('button', { name: 'Rolar d20' }));
    finishRoll();
    rerender(<DiceRollerDialog isOpen onClose={vi.fn()} />);
    expect(screen.getByText('11')).toBeTruthy();
  });

  it('desmontar no meio da rolagem para a animação sem erro', () => {
    const { unmount } = open();
    fireEvent.click(screen.getByRole('button', { name: 'Rolar d20' }));
    unmount();
    expect(() => finishRoll()).not.toThrow();
  });
});
