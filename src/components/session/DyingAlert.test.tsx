// O aviso do Mestre para quem está Morrendo. Termos: CONTEXT.md (Palco).
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DyingAlert } from './DyingAlert';

afterEach(cleanup);

describe('DyingAlert', () => {
  it('lista quem está Morrendo', () => {
    render(<DyingAlert names={['Eliabe', 'Noemi']} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Morrendo: Eliabe, Noemi.');
  });

  it('sem ninguém Morrendo, não aparece', () => {
    render(<DyingAlert names={[]} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
