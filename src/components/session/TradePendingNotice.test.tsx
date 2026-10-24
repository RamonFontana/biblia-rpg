// O aviso que a pessoa que pediu uma Troca vê enquanto o outro lado não responde. Termos:
// CONTEXT.md (Troca).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { TradeWithItems } from '@/types/trade';
import { TradePendingNotice } from './TradePendingNotice';

afterEach(cleanup);

const trade = (over: Partial<TradeWithItems> = {}): TradeWithItems =>
  ({
    id: 't1',
    type: 'player_trade',
    status: 'pending',
    trade_items: [],
    ...over,
  }) as TradeWithItems;

describe('TradePendingNotice', () => {
  it('Troca com outro jogador: diz para quem foi o pedido e que espera a resposta', () => {
    render(<TradePendingNotice trade={trade()} targetName="Rute" onCancel={vi.fn()} />);
    expect(screen.getByText('Pedido de Troca enviado')).toBeTruthy();
    expect(screen.getByText('Rute')).toBeTruthy();
    expect(screen.getByText(/Aguardando resposta/)).toBeTruthy();
  });

  it('Troca com NPC: diz que o Mestre precisa aceitar e com qual NPC', () => {
    render(
      <TradePendingNotice
        trade={trade({ type: 'npc_trade' })}
        targetName="Raabe"
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/Aguardando o Mestre aceitar/)).toBeTruthy();
    expect(screen.getByText('Raabe')).toBeTruthy();
  });

  it('sem o nome do alvo, usa um texto genérico', () => {
    const { rerender } = render(<TradePendingNotice trade={trade()} onCancel={vi.fn()} />);
    expect(screen.getByText('outro jogador')).toBeTruthy();
    rerender(<TradePendingNotice trade={trade({ type: 'npc_trade' })} onCancel={vi.fn()} />);
    expect(screen.getByText('o NPC')).toBeTruthy();
  });

  it('"Cancelar pedido" chama onCancel com o id da Troca', () => {
    const onCancel = vi.fn();
    render(<TradePendingNotice trade={trade()} targetName="Rute" onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }));
    expect(onCancel).toHaveBeenCalledWith('t1');
  });
});
