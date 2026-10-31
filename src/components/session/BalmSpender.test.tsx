// Usar o Bálsamo no Descanso Curto aberto: o que o cartão mostra e grava.
// Termos: CONTEXT.md (Bálsamo, Descanso Curto, Morrendo, Estável). ADR 0001: o dado físico vale.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const data = vi.hoisted(() => ({
  healCharacter: vi.fn(),
  removeInventoryItem: vi.fn(),
  setInventoryQuantity: vi.fn(),
}));
vi.mock('@/data-access/characters', () => ({ healCharacter: data.healCharacter }));
vi.mock('@/data-access/inventory', () => ({
  removeInventoryItem: data.removeInventoryItem,
  setInventoryQuantity: data.setInventoryQuantity,
}));
vi.mock('@/lib/systemRng', () => ({ systemRng: () => 0.99 }));

import { BalmSpender } from './BalmSpender';
import type { SpenderCharacter } from './HitDiceSpender';

const balm = (quantity: number, level = 1) => ({
  id: 'ci-balm',
  quantity,
  level,
  items: {
    slug: 'balsamo',
    name: 'Bálsamo Curativo / Óleo',
    description: 'Cura 1d4 HP em Descanso',
    is_consumable: true,
  },
});
const rope = { id: 'ci-rope', quantity: 1, level: 1, items: { slug: 'corda', name: 'Corda' } };

type Hero = SpenderCharacter & { character_items?: unknown[] };
const hero = (over: Partial<Hero> = {}): Hero => ({
  id: 'c1',
  name: 'Eliabe',
  tribe: 'Judá',
  vocation: 'Sacerdote',
  level: 3,
  hit_dice_spent: 0,
  attributes: { for: 10, des: 10, con: 18, int: 10, sab: 10, car: 10 },
  stats: { pv: 30, current_pv: 10, ca: 12, faith: 50, current_faith: 50 },
  skills: {},
  character_items: [rope, balm(2)],
  ...over,
});

const renderBalm = (character: Hero, restOpen = true) => {
  const onSpent = vi.fn();
  render(<BalmSpender character={character as never} restOpen={restOpen} onSpent={onSpent} />);
  return onSpent;
};

const typeRoll = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const useBalm = () => fireEvent.click(screen.getByRole('button', { name: 'Usar Bálsamo' }));

beforeEach(() => {
  data.healCharacter.mockReset().mockResolvedValue(undefined);
  data.removeInventoryItem.mockReset().mockResolvedValue(undefined);
  data.setInventoryQuantity.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(cleanup);

describe('BalmSpender: o que mostra', () => {
  it('mostra a quantidade e o dado a rolar', () => {
    renderBalm(hero());
    expect(screen.getByText('Bálsamo: 2')).toBeInTheDocument();
    expect(screen.getByLabelText(/Resultado do d4/)).toBeInTheDocument();
  });

  it('a Qualidade do item sobe o dado', () => {
    renderBalm(hero({ character_items: [balm(1, 2)] }));
    expect(screen.getByLabelText(/Resultado do d6/)).toBeInTheDocument();
  });

  it('sem Bálsamo no inventário, avisa e não deixa usar', () => {
    renderBalm(hero({ character_items: [rope] }));
    expect(screen.getByText('Sem Bálsamo no inventário.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usar Bálsamo' })).toBeDisabled();
  });
});

describe('BalmSpender: usar com o dado físico', () => {
  it('cura o resultado sem CON, grava o PV e depois gasta uma unidade', async () => {
    const onSpent = renderBalm(hero());
    typeRoll(/Resultado do d4/, '3');
    useBalm();
    await waitFor(() => expect(data.setInventoryQuantity).toHaveBeenCalledWith('ci-balm', 1));
    expect(data.healCharacter).toHaveBeenCalledWith('c1', {
      stats: expect.objectContaining({ current_pv: 13 }),
      wakeUp: false,
    });
    expect(data.healCharacter.mock.invocationCallOrder[0]).toBeLessThan(
      data.setInventoryQuantity.mock.invocationCallOrder[0],
    );
    expect(onSpent).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        stats: expect.objectContaining({ current_pv: 13 }),
        character_items: [rope, balm(1)],
      }),
    );
    expect(screen.getByText('Curou 3 PV (10 → 13).')).toBeInTheDocument();
  });

  it('a última unidade remove a linha do inventário', async () => {
    const onSpent = renderBalm(hero({ character_items: [balm(1), rope] }));
    typeRoll(/Resultado do d4/, '2');
    useBalm();
    await waitFor(() => expect(data.removeInventoryItem).toHaveBeenCalledWith('ci-balm'));
    expect(data.setInventoryQuantity).not.toHaveBeenCalled();
    expect(onSpent).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ character_items: [rope] }),
    );
  });

  it('não passa do PV máximo', async () => {
    renderBalm(hero({ stats: { pv: 30, current_pv: 29, ca: 12, faith: 50 } }));
    typeRoll(/Resultado do d4/, '4');
    useBalm();
    await waitFor(() => expect(data.healCharacter).toHaveBeenCalled());
    expect(data.healCharacter).toHaveBeenCalledWith('c1', {
      stats: expect.objectContaining({ current_pv: 30 }),
      wakeUp: false,
    });
    expect(screen.getByText('Curou 1 PV (29 → 30).')).toBeInTheDocument();
  });

  it('recusa resultado fora da faixa do dado e não grava nada', () => {
    renderBalm(hero());
    typeRoll(/Resultado do d4/, '5');
    useBalm();
    expect(screen.getByText('O dado vai de 1 a 4.')).toBeInTheDocument();
    expect(data.healCharacter).not.toHaveBeenCalled();
    expect(data.setInventoryQuantity).not.toHaveBeenCalled();
  });

  it('o botão só vale com um resultado digitado', () => {
    renderBalm(hero());
    expect(screen.getByRole('button', { name: 'Usar Bálsamo' })).toBeDisabled();
  });
});

describe('BalmSpender: dado virtual', () => {
  it('rola o dado, cura e conta o resultado', async () => {
    renderBalm(hero());
    fireEvent.click(screen.getByRole('button', { name: 'Rolar dado do Bálsamo' }));
    await waitFor(() => expect(data.healCharacter).toHaveBeenCalled());
    expect(data.healCharacter).toHaveBeenCalledWith('c1', {
      stats: expect.objectContaining({ current_pv: 14 }),
      wakeUp: false,
    });
    expect(screen.getByText('Rolou 4. Curou 4 PV (10 → 14).')).toBeInTheDocument();
  });
});

describe('BalmSpender: Estável', () => {
  it('acorda ao curar', async () => {
    const onSpent = renderBalm(
      hero({ stats: { pv: 30, current_pv: 0, ca: 12, faith: 50 }, is_stable: true }),
    );
    typeRoll(/Resultado do d4/, '2');
    useBalm();
    await waitFor(() => expect(data.healCharacter).toHaveBeenCalled());
    expect(data.healCharacter).toHaveBeenCalledWith('c1', {
      stats: expect.objectContaining({ current_pv: 2 }),
      wakeUp: true,
    });
    expect(onSpent).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        is_stable: false,
        death_saves_successes: 0,
        death_saves_failures: 0,
      }),
    );
  });
});

describe('BalmSpender: bloqueios', () => {
  it.each([
    ['PV já está no máximo.', { stats: { pv: 30, current_pv: 30, ca: 12, faith: 50 } }],
    ['Personagem morto.', { is_dead: true }],
    [
      'Morrendo: resolva os Testes de Morte antes.',
      { stats: { pv: 30, current_pv: 0, ca: 12, faith: 50 }, is_stable: false },
    ],
  ] as const)('%s', (message, change) => {
    renderBalm(hero(change as Partial<Hero>));
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByLabelText(/Resultado do d4/)).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rolar dado do Bálsamo' })).toBeDisabled();
  });

  it('com o Descanso fechado, diz que só vale no Descanso Curto', () => {
    renderBalm(hero(), false);
    expect(screen.getByText('Só no Descanso Curto.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usar Bálsamo' })).toBeDisabled();
  });
});

describe('BalmSpender: falhas', () => {
  it('se a cura não grava, mostra erro e não gasta o item', async () => {
    data.healCharacter.mockRejectedValue(new Error('x'));
    const onSpent = renderBalm(hero());
    typeRoll(/Resultado do d4/, '3');
    useBalm();
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível usar o Bálsamo');
    expect(data.setInventoryQuantity).not.toHaveBeenCalled();
    expect(onSpent).not.toHaveBeenCalled();
  });

  it('se o consumo falha, a cura já gravada aparece e o item segue na tela', async () => {
    data.setInventoryQuantity.mockRejectedValue(new Error('x'));
    const onSpent = renderBalm(hero());
    typeRoll(/Resultado do d4/, '3');
    useBalm();
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível gastar o Bálsamo');
    expect(onSpent).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ stats: expect.objectContaining({ current_pv: 13 }) }),
    );
    expect(onSpent).not.toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ character_items: expect.anything() }),
    );
  });
});
