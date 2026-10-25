// O aviso fixo de Ruptura na tela do Mestre: aparece enquanto algum jogador tem Fé 0, com os
// nomes, e some quando a Fé sobe. Termos: CONTEXT.md (Estado de Fé).
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RuptureAlert } from './RuptureAlert';

afterEach(cleanup);

const player = (name: string, current_faith: number) =>
  ({ user_id: name, character: { id: name, name, stats: { current_faith } } }) as never;

describe('RuptureAlert', () => {
  it('sem ninguém em Ruptura, não aparece', () => {
    render(<RuptureAlert players={[player('Eli', 40), player('Noa', 1)]} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('com Fé 0 aparece com o nome de quem está em Ruptura, só deles', () => {
    render(<RuptureAlert players={[player('Eli', 0), player('Noa', 12), player('Ana', 0)]} />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Ruptura');
    expect(alert.textContent).toContain('Eli');
    expect(alert.textContent).toContain('Ana');
    expect(alert.textContent).not.toContain('Noa');
  });

  it('some quando a Fé passa de 0', () => {
    const { rerender } = render(<RuptureAlert players={[player('Eli', 0)]} />);
    expect(screen.getByRole('alert')).toBeTruthy();
    rerender(<RuptureAlert players={[player('Eli', 1)]} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
