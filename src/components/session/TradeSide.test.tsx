// A linha de um item na troca mostra a Resistência a Condição personalizada e os efeitos de arma.
// A personalizada diz em texto que é personalizada (a cor é só reforço). Decisões: ROADMAP.md,
// Onda 4, passo 6c-3. Termos: CONTEXT.md (Resistência a Condição).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('@/data-access/trades', () => ({
  addTradeItem: vi.fn(),
  getTradeInventory: vi.fn(async () => []),
  listTradeableItems: vi.fn(async () => []),
  removeTradeItem: vi.fn(),
  updateTradeCoins: vi.fn(),
  updateTradeItemLevel: vi.fn(),
  updateTradeItemQuantity: vi.fn(),
  updateTradeItemResistances: vi.fn(),
  updateTradeItemWeaponEffects: vi.fn(),
}));

import { TradeSide } from './TradeSide';
import type { TradeItemWithDetails } from '@/types/trade';

afterEach(cleanup);

const tradeItem = (over: Partial<TradeItemWithDetails> = {}): TradeItemWithDetails => ({
  id: 'ti-1',
  trade_id: 't-1',
  side: 'initiator',
  item_id: 'item-1',
  quantity: 1,
  level: 1,
  created_at: '',
  items: { id: 'item-1', name: 'Elmo de Bronze', category: 'Armadura' },
  ...over,
});

const show = (tradeItems: TradeItemWithDetails[]) =>
  render(
    <TradeSide
      label="Você"
      side="initiator"
      tradeId="t-1"
      coins={0}
      tradeItems={tradeItems}
      isReady={false}
      otherSideReady={false}
      canEdit={false}
      onCoinsChange={vi.fn()}
      onReady={vi.fn()}
      onItemsChanged={vi.fn()}
    />,
  );

describe('TradeSide: resistências e efeitos no item', () => {
  it('a resistência personalizada leva a nota "Resistência personalizada"', () => {
    show([tradeItem({ custom_condition_resistances: ['Fogo', 'Frio'] })]);
    expect(screen.getByText('Fogo').getAttribute('title')).toBe('Resistência personalizada');
    expect(screen.getByText('Frio').getAttribute('title')).toBe('Resistência personalizada');
  });

  it('sem resistência personalizada não há selo', () => {
    show([tradeItem()]);
    expect(screen.queryByTitle('Resistência personalizada')).toBeNull();
  });

  it('o efeito de arma é outro selo, sem a nota de personalizada', () => {
    show([
      tradeItem({
        items: { id: 'item-1', name: 'Espada Curta', category: 'Arma' },
        weapon_effects: [{ conditionId: 'sangrando' } as never],
      }),
    ]);
    expect(screen.getByText('Sangrando')).toBeTruthy();
    expect(screen.queryByTitle('Resistência personalizada')).toBeNull();
  });
});
