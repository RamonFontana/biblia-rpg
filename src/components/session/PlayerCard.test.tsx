// Os selos de estado do cartão do jogador na mesa: Mestre, Testando e Negociando. Cada um se
// distingue pelo texto e pelo emoji (a cor é só reforço), e o Mestre nunca aparece como
// "Testando" nem "Negociando". Decisões: ROADMAP.md, Onda 4, passo 6c-3.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getSession: async () => ({ data: { session: null } }),
    },
  },
}));

import { PlayerCard } from './PlayerCard';

afterEach(cleanup);

const user = { user_id: 'u1', online_at: '', name: 'Eli', username: 'eli' } as never;
const show = (props: { isSessionGM?: boolean; isBusy?: boolean; isTrading?: boolean }) =>
  render(<PlayerCard user={user} {...props} />);

describe('PlayerCard: selos de estado', () => {
  it('sem estado especial, nenhum selo', () => {
    show({});
    expect(screen.queryByText(/Mestre|Testando|Negociando/)).toBeNull();
  });

  it('o Mestre da sessão leva o selo "👑 Mestre"', () => {
    show({ isSessionGM: true });
    expect(screen.getByText(/👑 Mestre/)).toBeTruthy();
  });

  it('quem está num Teste leva "🎲 Testando..."', () => {
    show({ isBusy: true });
    expect(screen.getByText(/🎲 Testando\.\.\./)).toBeTruthy();
    expect(screen.queryByText(/Negociando/)).toBeNull();
  });

  it('quem está numa troca leva "⚖️ Negociando..."', () => {
    show({ isTrading: true });
    expect(screen.getByText(/⚖️ Negociando\.\.\./)).toBeTruthy();
    expect(screen.queryByText(/Testando/)).toBeNull();
  });

  it('os dois selos juntos aparecem lado a lado, ambos pulsando', () => {
    show({ isBusy: true, isTrading: true });
    const testing = screen.getByText(/Testando/);
    const trading = screen.getByText(/Negociando/);
    expect(testing.className).toContain('animate-pulse');
    expect(trading.className).toContain('animate-pulse');
  });

  it('o Mestre da sessão não recebe os selos de Teste nem de troca', () => {
    show({ isSessionGM: true, isBusy: true, isTrading: true });
    expect(screen.getByText(/👑 Mestre/)).toBeTruthy();
    expect(screen.queryByText(/Testando|Negociando/)).toBeNull();
  });

  it('o selo de Teste e o de troca não têm a mesma aparência', () => {
    show({ isBusy: true, isTrading: true });
    expect(screen.getByText(/Testando/).className).not.toBe(
      screen.getByText(/Negociando/).className,
    );
  });
});
