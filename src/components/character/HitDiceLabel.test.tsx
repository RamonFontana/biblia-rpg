// O rótulo "Dados de Vida restantes/total (dX)" da ficha e do cartão do jogador do Mestre.
// Termos: CONTEXT.md (Dado de Vida).
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { HitDiceLabel } from './HitDiceLabel';

afterEach(cleanup);

describe('HitDiceLabel', () => {
  it('mostra os restantes, o total e o dado da Vocação', () => {
    render(<HitDiceLabel level={5} spent={2} vocation="Guerreiro" />);
    expect(screen.getByText('Dados de Vida 3/5 (d10)')).toBeTruthy();
  });

  it('Batedor usa d8 e, sem gastos, todos restam', () => {
    render(<HitDiceLabel level={1} spent={0} vocation="Batedor" />);
    expect(screen.getByText('Dados de Vida 1/1 (d8)')).toBeTruthy();
  });

  it('ficha antiga sem a coluna conta 0 gastos', () => {
    render(<HitDiceLabel level={3} spent={undefined} vocation="Sacerdote" />);
    expect(screen.getByText('Dados de Vida 3/3 (d8)')).toBeTruthy();
  });
});
