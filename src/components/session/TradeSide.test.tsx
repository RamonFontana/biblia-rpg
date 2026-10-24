// A linha de um item na troca mostra a Resistência a Condição personalizada e os efeitos de arma.
// A personalizada diz em texto que é personalizada (a cor é só reforço). Decisões: ROADMAP.md,
// Onda 4, passo 6c-3. Termos: CONTEXT.md (Resistência a Condição).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

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

const sideWith = (tradeItems: TradeItemWithDetails[], coins = 0) => (
  <TradeSide
    label="Você"
    side="initiator"
    tradeId="t-1"
    coins={coins}
    tradeItems={tradeItems}
    isReady={false}
    otherSideReady={false}
    canEdit={false}
    onCoinsChange={vi.fn()}
    onReady={vi.fn()}
    onItemsChanged={vi.fn()}
  />
);
const show = (tradeItems: TradeItemWithDetails[], coins = 0) => render(sideWith(tradeItems, coins));

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

describe('TradeSide: campo de SP', () => {
  // O rótulo não está ligado ao campo; sem itens, é o único campo numérico.
  const coinsField = () => screen.getByRole('spinbutton') as HTMLInputElement;

  it('mostra as moedas da troca', () => {
    show([], 12);
    expect(coinsField().value).toBe('12');
  });

  it('o que o jogador digita fica no campo enquanto as moedas da troca não mudam', () => {
    const { rerender } = show([], 12);
    fireEvent.change(coinsField(), { target: { value: '30' } });
    rerender(sideWith([], 12));
    expect(coinsField().value).toBe('30');
  });

  it('quando as moedas da troca mudam, o campo passa a mostrar o novo valor', () => {
    const { rerender } = show([], 12);
    fireEvent.change(coinsField(), { target: { value: '30' } });
    rerender(sideWith([], 45));
    expect(coinsField().value).toBe('45');
  });

  it('as moedas da troca voltarem ao mesmo valor não apagam o que foi digitado', () => {
    const { rerender } = show([], 12);
    rerender(sideWith([], 12));
    fireEvent.change(coinsField(), { target: { value: '8' } });
    rerender(sideWith([], 12));
    expect(coinsField().value).toBe('8');
  });
});

describe('TradeSide: saldo', () => {
  // Decisão do autor (ROADMAP, passo 9d, Q15c): o saldo fracionado aparece arredondado.
  const withBalance = (characterCoins: number, coins = 0, canEdit = true) =>
    render(
      <TradeSide
        label="Você"
        side="initiator"
        tradeId="t-1"
        coins={coins}
        tradeItems={[]}
        isReady={false}
        otherSideReady={false}
        canEdit={canEdit}
        characterCoins={characterCoins}
        onCoinsChange={vi.fn()}
        onReady={vi.fn()}
        onItemsChanged={vi.fn()}
      />,
    );

  it('mostra o saldo inteiro como está', () => {
    withBalance(50);
    expect(screen.getByText('Saldo: 50 SP')).toBeInTheDocument();
  });

  it('arredonda o saldo fracionado na exibição', () => {
    withBalance(49.975);
    expect(screen.getByText('Saldo: 49.98 SP')).toBeInTheDocument();
  });

  it('o aviso de saldo insuficiente também mostra o saldo arredondado', async () => {
    withBalance(49.975, 60);
    fireEvent.click(screen.getByRole('button', { name: /Pronto/ }));
    expect(
      await screen.findByText('Saldo insuficiente de SP. Você tem 49.98 SP.'),
    ).toBeInTheDocument();
  });
});
