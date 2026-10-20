// CARACTERIZAÇÃO: fixa o passo de atributos da criação (Standard Array ou 4d6, descartando o menor).
// A regra do sorteio é testada em domain/attributeGeneration; aqui, o que a tela faz com ela.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../../hooks/useQuickSave', () => ({
  useQuickSave: () => ({ quickSave: vi.fn(), saving: false, message: null, isEditing: false }),
}));
// O sorteio do app vira um Rng com seed que o teste reinicia a cada caso.
const dice = vi.hoisted(() => ({ rng: (() => 0) as () => number }));
vi.mock('@/lib/systemRng', () => ({ systemRng: () => dice.rng() }));

import { STANDARD_ARRAY, rollAttributeScores } from '@/domain/attributeGeneration';
import { createSeededRng } from '@/domain/rng';
import { useCharacterCreationStore } from '../../store/useCharacterCreationStore';
import { AttributeGeneration } from './AttributeGeneration';

const KEYS = ['for', 'des', 'con', 'int', 'sab', 'car'] as const;
const selects = () => screen.getAllByRole('combobox') as HTMLSelectElement[];

beforeEach(() => {
  dice.rng = createSeededRng(7);
  useCharacterCreationStore.getState().reset();
  useCharacterCreationStore.setState({ currentStep: 4 });
});
afterEach(cleanup);

describe('escolha do método', () => {
  it('começa oferecendo os dois métodos, sem nenhum campo de atributo', () => {
    render(<AttributeGeneration />);
    expect(screen.getByText('Standard Array')).toBeInTheDocument();
    expect(screen.getByText('Rolar Dados')).toBeInTheDocument();
    expect(screen.queryAllByRole('combobox')).toEqual([]);
  });
});

describe('Standard Array', () => {
  const choose = () => {
    render(<AttributeGeneration />);
    fireEvent.click(screen.getByText('Standard Array'));
  };

  it('mostra os 6 valores e os 6 campos zerados, à espera da escolha', () => {
    choose();
    for (const v of STANDARD_ARRAY)
      expect(screen.getAllByText(String(v)).length).toBeGreaterThan(0);
    expect(selects().map((s) => s.value)).toEqual(['0', '0', '0', '0', '0', '0']);
  });

  it('um valor já usado fica desligado nos outros campos', () => {
    choose();
    fireEvent.change(selects()[0], { target: { value: '15' } });
    const option = (select: HTMLSelectElement, value: string) =>
      Array.from(select.options).find((o) => o.value === value)!;
    expect(option(selects()[1], '15').disabled).toBe(true);
    expect(option(selects()[0], '15').disabled).toBe(false);
  });

  it('o valor já usado aparece riscado entre os valores gerados', () => {
    choose();
    const chip = (v: number) => screen.getByText(String(v), { selector: 'span' });
    expect(chip(15)).not.toHaveClass('line-through');
    fireEvent.change(selects()[0], { target: { value: '15' } });
    expect(chip(15)).toHaveClass('line-through');
    expect(chip(14)).not.toHaveClass('line-through');
  });

  it('avançar sem preencher mostra o erro e não sai do passo', async () => {
    choose();
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    await waitFor(() =>
      expect(screen.getAllByText(/./, { selector: 'p.text-red-400' })).toHaveLength(6),
    );
    expect(useCharacterCreationStore.getState().currentStep).toBe(4);
  });

  it('com os 6 valores escolhidos, grava os atributos e avança', async () => {
    choose();
    selects().forEach((s, i) =>
      fireEvent.change(s, { target: { value: String(STANDARD_ARRAY[i]) } }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    await waitFor(() => expect(useCharacterCreationStore.getState().currentStep).toBe(5));
    expect(useCharacterCreationStore.getState().draft.attributes).toEqual({
      for: 15,
      des: 14,
      con: 13,
      int: 12,
      sab: 10,
      car: 8,
    });
  });

  it('Voltar volta ao passo anterior', () => {
    choose();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(useCharacterCreationStore.getState().currentStep).toBe(3);
  });
});

describe('Rolar Dados', () => {
  it('rola 6 valores com o sorteio do app e os atribui na ordem, sem deixar editar', async () => {
    const expected = rollAttributeScores(createSeededRng(7));
    render(<AttributeGeneration />);
    fireEvent.click(screen.getByText('Rolar Dados'));
    expect(selects().map((s) => Number(s.value))).toEqual(expected);
    expect(selects().every((s) => s.disabled)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    await waitFor(() => expect(useCharacterCreationStore.getState().currentStep).toBe(5));
    const { attributes } = useCharacterCreationStore.getState().draft;
    expect(KEYS.map((k) => attributes![k])).toEqual(expected);
  });

  it('"Rolar Novamente" sorteia outro conjunto', () => {
    render(<AttributeGeneration />);
    fireEvent.click(screen.getByText('Rolar Dados'));
    const first = selects().map((s) => Number(s.value));
    fireEvent.click(screen.getByText('Rolar Novamente'));
    const second = selects().map((s) => Number(s.value));
    const rng = createSeededRng(7);
    expect(first).toEqual(rollAttributeScores(rng));
    expect(second).toEqual(rollAttributeScores(rng));
  });
});

describe('personagem travado numa sessão', () => {
  it('abre direto nos valores atuais, avisa e não deixa editar', () => {
    useCharacterCreationStore.setState({
      isLocked: true,
      draft: { attributes: { for: 15, des: 14, con: 13, int: 12, sab: 10, car: 8 } },
    });
    render(<AttributeGeneration />);
    expect(screen.getByText(/Personagem já está participando de uma sessão/)).toBeInTheDocument();
    expect(selects().map((s) => Number(s.value))).toEqual([15, 14, 13, 12, 10, 8]);
    expect(selects().every((s) => s.disabled)).toBe(true);
  });
});
