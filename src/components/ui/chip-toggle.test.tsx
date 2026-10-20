// ChipToggle: chip âmbar quando ativo, pedra quando não; um botão de verdade.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { ChipToggle } from './chip-toggle';

afterEach(cleanup);

describe('ChipToggle', () => {
  it('ativo: âmbar cheio, texto escuro e negrito', () => {
    render(<ChipToggle active>Tribo</ChipToggle>);
    expect(screen.getByRole('button', { name: 'Tribo' }).className).toBe(
      'px-3 py-1 rounded text-sm bg-amber-600 text-stone-900 font-bold',
    );
  });

  it('inativo: pedra, com hover mais claro', () => {
    render(<ChipToggle active={false}>Tribo</ChipToggle>);
    expect(screen.getByRole('button', { name: 'Tribo' }).className).toBe(
      'px-3 py-1 rounded text-sm bg-stone-700 text-stone-300 hover:bg-stone-600',
    );
  });

  it('diz o estado aos leitores de tela', () => {
    const { rerender } = render(<ChipToggle active>Tribo</ChipToggle>);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
    rerender(<ChipToggle active={false}>Tribo</ChipToggle>);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false');
  });

  it('é type=button por padrão (não envia formulário), mas aceita outro tipo', () => {
    const { rerender } = render(<ChipToggle active={false}>X</ChipToggle>);
    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
    rerender(
      <ChipToggle active={false} type="submit">
        X
      </ChipToggle>,
    );
    expect(screen.getByRole('button').getAttribute('type')).toBe('submit');
  });

  it('chama onClick e respeita disabled', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <ChipToggle active={false} onClick={onClick}>
        X
      </ChipToggle>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(
      <ChipToggle active={false} onClick={onClick} disabled>
        X
      </ChipToggle>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('uma classe de quem usa entra depois da receita', () => {
    render(
      <ChipToggle active className="text-xs">
        X
      </ChipToggle>,
    );
    const { className } = screen.getByRole('button');
    expect(className).toContain('text-xs');
    expect(className).not.toContain('text-sm');
    expect(className).toContain('bg-amber-600');
  });
});
