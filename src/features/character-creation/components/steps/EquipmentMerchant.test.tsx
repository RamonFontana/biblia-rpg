// CARACTERIZAÇÃO: fixa o comportamento ATUAL da loja inicial da criação de personagem (carteira
// de 50 Siclos, compra, venda e Pacote Inicial) antes de a regra sair do componente.
// Termos: CONTEXT.md (Vocação). Conteúdo: src/content/{items,kits,proficiencies}.ts.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

vi.mock('../../hooks/useQuickSave', () => ({
  useQuickSave: () => ({ quickSave: vi.fn(), saving: false, message: null, isEditing: false }),
}));

import { ITEMS_DB } from '@/content/items';
import { KITS_DB } from '@/content/kits';
import { VOCATION_PROFICIENCIES } from '@/content/proficiencies';
import { useCharacterCreationStore } from '../../store/useCharacterCreationStore';
import type { DraftCharacter } from '../../types';
import { EquipmentMerchant } from './EquipmentMerchant';

const weaponFor = (vocation: string) =>
  ITEMS_DB.filter(
    (i) => i.type === 'Arma' && VOCATION_PROFICIENCIES[vocation].includes(i.category) && i.cost > 0,
  ).sort((a, b) => a.cost - b.cost);

type Seed = { draft?: DraftCharacter; currentStep?: number; isLocked?: boolean };

const start = (seed: Seed = {}) => {
  useCharacterCreationStore.getState().reset();
  useCharacterCreationStore.setState(seed);
  return render(<EquipmentMerchant />);
};

const withDraft = (over: Partial<DraftCharacter>) => ({
  draft: { vocation: 'Guerreiro', coins: 0, equipment: [], ...over },
});

const wallet = () => screen.getByText(/Siclos$/).textContent;
const bag = () => within(screen.getByText('Seu Inventário').closest('div')!.parentElement!);
const openTab = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const buyButton = (item: { cost: number }) =>
  screen.getAllByRole('button', { name: `${item.cost} SP` })[0];

beforeEach(() => {
  useCharacterCreationStore.getState().reset();
});
afterEach(cleanup);

describe('carteira', () => {
  it('começa com 50 Siclos quando o rascunho não traz moedas', () => {
    start(withDraft({ coins: 0 }));
    expect(wallet()).toBe('50 Siclos');
  });

  it('retoma as moedas do rascunho', () => {
    start(withDraft({ coins: 31 }));
    expect(wallet()).toBe('31 Siclos');
  });

  it('retoma os itens do rascunho na bolsa', () => {
    start(
      withDraft({
        coins: 40,
        equipment: [{ id: 'x', name: 'Faca Velha', type: 'Arma', cost: 10 }],
      }),
    );
    expect(bag().getByText('Faca Velha')).toBeInTheDocument();
  });
});

describe('comprar e vender', () => {
  it('comprar tira o preço da carteira e põe o item na bolsa', () => {
    const item = weaponFor('Guerreiro')[0];
    start(withDraft({}));
    openTab('Armas');
    fireEvent.click(buyButton(item));
    expect(wallet()).toBe(`${50 - item.cost} Siclos`);
    expect(bag().getByText(item.name)).toBeInTheDocument();
  });

  it('o botão de compra fica desligado quando a carteira não cobre o preço', () => {
    const item = weaponFor('Guerreiro')[0];
    start(withDraft({ coins: item.cost - 0.01 }));
    openTab('Armas');
    expect(buyButton(item)).toBeDisabled();
  });

  it('vender devolve o preço do item e tira da bolsa', () => {
    const item = weaponFor('Guerreiro')[0];
    start(withDraft({}));
    openTab('Armas');
    fireEvent.click(buyButton(item));
    fireEvent.click(bag().getByRole('button', { name: `Vender (+${item.cost} SP)` }));
    expect(wallet()).toBe('50 Siclos');
    expect(bag().getByText('Sua bolsa está vazia.')).toBeInTheDocument();
  });

  it('o mesmo item pode ser comprado mais de uma vez', () => {
    const item = weaponFor('Guerreiro')[0];
    start(withDraft({}));
    openTab('Armas');
    fireEvent.click(buyButton(item));
    fireEvent.click(buyButton(item));
    expect(bag().getAllByText(item.name)).toHaveLength(2);
    expect(wallet()).toBe(`${50 - 2 * item.cost} Siclos`);
  });

  it('com o personagem travado numa sessão, não compra nem vende', () => {
    const item = weaponFor('Guerreiro')[0];
    start({
      ...withDraft({ equipment: [{ id: 'x', name: 'Faca Velha', type: 'Arma', cost: 10 }] }),
      isLocked: true,
    });
    openTab('Armas');
    expect(buyButton(item)).toBeDisabled();
    expect(bag().getByRole('button', { name: /Vender/ })).toBeDisabled();
  });
});

describe('Pacote Inicial', () => {
  const kit = KITS_DB.Guerreiro;

  it('troca tudo pelo kit e deixa na carteira só a sobra do kit', () => {
    start(withDraft({}));
    fireEvent.click(screen.getByRole('button', { name: 'Pegar Pacote' }));
    expect(wallet()).toBe(`${kit.leftover} Siclos`);
    expect(bag().getByText(kit.name)).toBeInTheDocument();
  });

  it('com o kit na bolsa, nenhuma compra avulsa é permitida', () => {
    const item = weaponFor('Guerreiro')[0];
    start(withDraft({}));
    fireEvent.click(screen.getByRole('button', { name: 'Pegar Pacote' }));
    openTab('Armas');
    expect(buyButton(item)).toBeDisabled();
  });

  it('vender o kit devolve os 50 Siclos inteiros, não só o que sobrou', () => {
    start(withDraft({}));
    fireEvent.click(screen.getByRole('button', { name: 'Pegar Pacote' }));
    fireEvent.click(bag().getByRole('button', { name: 'Vender (+50 SP)' }));
    expect(wallet()).toBe('50 Siclos');
  });

  it('o kit só pode ser pego com 50 Siclos na carteira', () => {
    start(withDraft({ coins: 49 }));
    expect(screen.getByRole('button', { name: 'Pegar Pacote' })).toBeDisabled();
  });

  it('a aba do Pacote Inicial só existe se a Vocação tem kit', () => {
    start(withDraft({ vocation: 'Nobre' }));
    expect(screen.queryByRole('button', { name: 'Pacote Inicial' })).not.toBeInTheDocument();
  });
});

describe('catálogo por Vocação', () => {
  it('mostra só itens cuja categoria a Vocação sabe usar', () => {
    const marcial = ITEMS_DB.find((i) => i.type === 'Arma' && i.category === 'Marcial')!;
    start(withDraft({ vocation: 'Sacerdote' }));
    openTab('Armas');
    expect(screen.queryByText(marcial.name)).not.toBeInTheDocument();
    cleanup();
    start(withDraft({ vocation: 'Guerreiro' }));
    openTab('Armas');
    expect(screen.getByText(marcial.name)).toBeInTheDocument();
  });

  it('sem Vocação escolhida, a loja usa a do Guerreiro', () => {
    const marcial = ITEMS_DB.find((i) => i.type === 'Arma' && i.category === 'Marcial')!;
    start(withDraft({ vocation: '' }));
    expect(screen.getByText(KITS_DB.Guerreiro.name, { exact: false })).toBeInTheDocument();
    openTab('Armas');
    expect(screen.getByText(marcial.name)).toBeInTheDocument();
  });

  it('Vocação sem proficiência cadastrada vê só itens da categoria "Todas"', () => {
    start(withDraft({ vocation: 'Nobre' }));
    openTab('Geral');
    const todas = ITEMS_DB.filter(
      (i) => i.category === 'Todas' && (i.type === 'Consumível' || i.type === 'Utilidade'),
    );
    const outros = ITEMS_DB.filter(
      (i) => i.category !== 'Todas' && (i.type === 'Consumível' || i.type === 'Utilidade'),
    );
    for (const i of todas) expect(screen.getByText(i.name)).toBeInTheDocument();
    for (const i of outros) expect(screen.queryByText(i.name)).not.toBeInTheDocument();
  });

  it('cada aba lista só o seu tipo: armaduras e escudos, e consumíveis e utilidades em Geral', () => {
    start(withDraft({}));
    openTab('Armaduras');
    const tipos = (names: string[]) => names.map((n) => ITEMS_DB.find((i) => i.name === n)?.type);
    const shown = ITEMS_DB.filter((i) => screen.queryByText(i.name));
    expect(new Set(tipos(shown.map((i) => i.name)))).toEqual(new Set(['Armadura', 'Escudo']));
  });
});

describe('moedas fracionadas', () => {
  // Decisão do autor (ROADMAP, passo 9d, Q15c): a carteira guarda o valor exato (a Pedra para Funda
  // custa 0,025 SP) e só a exibição é arredondada.
  it('a carteira mostra o valor arredondado', () => {
    start(withDraft({ coins: 49.975 }));
    expect(wallet()).toBe('49.98 Siclos');
  });

  it('o rascunho guarda o valor exato, sem arredondar', async () => {
    start({ ...withDraft({ coins: 49.975 }), currentStep: 6 });
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    await vi.waitFor(() => expect(useCharacterCreationStore.getState().currentStep).toBe(7));
    expect(useCharacterCreationStore.getState().draft.coins).toBe(49.975);
  });

  it('comprar um item fracionado mostra a carteira sem ruído de ponto flutuante', () => {
    const torch = ITEMS_DB.find((i) => i.id === 'tocha')!;
    start(withDraft({ coins: 50, vocation: 'Guerreiro' }));
    openTab('Geral');
    fireEvent.click(screen.getAllByRole('button', { name: `${torch.cost} SP` })[0]);
    expect(wallet()).toBe('49.5 Siclos');
  });

  it('o preço do item continua exato no botão de compra', () => {
    start(withDraft({ coins: 50, vocation: 'Guerreiro' }));
    openTab('Geral');
    expect(screen.getAllByRole('button', { name: '0.025 SP' }).length).toBeGreaterThan(0);
  });
});

describe('avançar', () => {
  it('grava a bolsa e a carteira no rascunho e vai para o próximo passo', async () => {
    const item = weaponFor('Guerreiro')[0];
    start({ ...withDraft({}), currentStep: 6 });
    openTab('Armas');
    fireEvent.click(buyButton(item));
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    await vi.waitFor(() => expect(useCharacterCreationStore.getState().currentStep).toBe(7));
    const { draft } = useCharacterCreationStore.getState();
    expect(draft.coins).toBe(50 - item.cost);
    expect((draft.equipment as { id: string }[]).map((e) => e.id)).toEqual([item.id]);
  });
});
