// ProgressBar: trilho de pedra, preenchimento âmbar proporcional a value/max.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { ProgressBar } from './progress-bar';

afterEach(cleanup);

const fill = () => screen.getByRole('progressbar').firstElementChild as HTMLElement;

describe('ProgressBar', () => {
  it('o trilho e o preenchimento seguem a receita', () => {
    render(<ProgressBar value={50} />);
    expect(screen.getByRole('progressbar').className).toBe(
      'w-full bg-stone-700 h-2 rounded-full overflow-hidden',
    );
    expect(fill().className).toBe('bg-amber-500 h-full transition-all duration-300');
  });

  it('sem max, value é uma porcentagem', () => {
    render(<ProgressBar value={37} />);
    expect(fill().style.width).toBe('37%');
  });

  it('o preenchimento é value/max', () => {
    render(<ProgressBar value={3} max={9} />);
    expect(parseFloat(fill().style.width)).toBeCloseTo(100 / 3, 6);
  });

  it('cheia em value = max e vazia em 0', () => {
    const { rerender } = render(<ProgressBar value={9} max={9} />);
    expect(fill().style.width).toBe('100%');
    rerender(<ProgressBar value={0} max={9} />);
    expect(fill().style.width).toBe('0%');
  });

  it('valores fora do intervalo ficam nos extremos', () => {
    const { rerender } = render(<ProgressBar value={15} max={10} />);
    expect(fill().style.width).toBe('100%');
    rerender(<ProgressBar value={-4} max={10} />);
    expect(fill().style.width).toBe('0%');
  });

  it('max zero ou negativo não divide: barra vazia', () => {
    const { rerender } = render(<ProgressBar value={5} max={0} />);
    expect(fill().style.width).toBe('0%');
    rerender(<ProgressBar value={5} max={-2} />);
    expect(fill().style.width).toBe('0%');
  });

  it('expõe o valor aos leitores de tela', () => {
    render(<ProgressBar value={4} max={9} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('9');
    expect(bar.getAttribute('aria-valuenow')).toBe('4');
  });

  it('uma classe de quem usa entra no trilho sem tirar a receita', () => {
    render(<ProgressBar value={1} className="mt-4" />);
    const { className } = screen.getByRole('progressbar');
    expect(className).toContain('mt-4');
    expect(className).toContain('bg-stone-700');
  });
});
