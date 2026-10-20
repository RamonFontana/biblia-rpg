// CARACTERIZAÇÃO: o painel do Teste de Morte do jogador: os três estados (Morrendo, Estável,
// Morto), as marcas de Sucessos e Falhas e o que cada d20 digitado causa. Cada estado tem título
// próprio (a cor é só reforço). Decisões: ROADMAP.md, Onda 4, passo 6c-5.
// Termos: CONTEXT.md (Teste de Morte, Morrendo, Estável, Morto).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  addSuccess: vi.fn(),
  addFailure: vi.fn(),
  healAndAwake: vi.fn(),
}));

vi.mock('../../hooks/useDeathSaves', () => ({
  useDeathSaves: () => ({
    addSuccess: h.addSuccess,
    addFailure: h.addFailure,
    healAndAwake: h.healAndAwake,
  }),
}));

import { DeathSavesModal } from './DeathSavesModal';

beforeEach(() => {
  Object.values(h).forEach((fn) => fn.mockReset().mockResolvedValue(undefined));
});
afterEach(cleanup);

const character = (over: Record<string, unknown> = {}) => ({
  id: 'char-1',
  death_saves_successes: 0,
  death_saves_failures: 0,
  ...over,
});
const dots = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.rounded-full')).map((el) => el.className);

describe('DeathSavesModal: estados', () => {
  it('sem personagem não desenha nada', () => {
    const { container } = render(<DeathSavesModal character={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('Morto: "Você Morreu", sem campo para rolar', () => {
    render(<DeathSavesModal character={character({ is_dead: true })} />);
    expect(screen.getByText('Você Morreu')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Valor 1-20')).toBeNull();
  });

  it('Estável: "Estável", sem campo para rolar', () => {
    render(<DeathSavesModal character={character({ is_stable: true })} />);
    expect(screen.getByText('Estável')).toBeTruthy();
    expect(screen.queryByPlaceholderText('Valor 1-20')).toBeNull();
  });

  it('Morto vale mais que Estável', () => {
    render(<DeathSavesModal character={character({ is_dead: true, is_stable: true })} />);
    expect(screen.getByText('Você Morreu')).toBeTruthy();
    expect(screen.queryByText('Estável')).toBeNull();
  });

  it('Morrendo: "Teste de Morte" com o campo, o botão e a tabela do d20', () => {
    render(<DeathSavesModal character={character()} />);
    expect(screen.getByText('Teste de Morte')).toBeTruthy();
    expect(screen.getByPlaceholderText('Valor 1-20')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Rolar Auto' })).toBeTruthy();
    expect(screen.getByText(/1 = 2 Falhas \| 2-9 = 1 Falha \| 10-19 = 1 Sucesso/)).toBeTruthy();
  });

  it('os três estados não têm a mesma aparência de painel', () => {
    const classes = [{ is_dead: true }, { is_stable: true }, {}].map((state) => {
      const { container, unmount } = render(<DeathSavesModal character={character(state)} />);
      const cls = (container.firstElementChild as HTMLElement).className;
      unmount();
      return cls;
    });
    expect(new Set(classes).size).toBe(3);
  });
});

describe('DeathSavesModal: marcas de Sucessos e Falhas', () => {
  it('sem nada marcado, as seis marcas estão vazias', () => {
    const { container } = render(<DeathSavesModal character={character()} />);
    const all = dots(container);
    expect(all).toHaveLength(6);
    expect(all.filter((c) => c.includes('bg-transparent'))).toHaveLength(6);
  });

  it('2 Sucessos e 1 Falha enchem 2 marcas verdes e 1 de falha', () => {
    const { container } = render(
      <DeathSavesModal
        character={character({ death_saves_successes: 2, death_saves_failures: 1 })}
      />,
    );
    const all = dots(container);
    expect(all.filter((c) => c.includes('bg-green-500'))).toHaveLength(2);
    expect(all.filter((c) => c.includes('bg-destructive'))).toHaveLength(1);
    expect(all.filter((c) => c.includes('bg-transparent'))).toHaveLength(3);
  });
});

describe('DeathSavesModal: o d20 digitado', () => {
  const roll = (value: string) => {
    fireEvent.change(screen.getByPlaceholderText('Valor 1-20'), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
  };
  const show = (over: Record<string, unknown> = {}, participantId?: string) =>
    render(<DeathSavesModal character={character(over)} participantId={participantId} />);

  it('1 natural: 2 Falhas', async () => {
    show({ death_saves_failures: 1 });
    roll('1');
    await waitFor(() => expect(h.addFailure).toHaveBeenCalledWith('char-1', 1, 2));
    expect(h.addSuccess).not.toHaveBeenCalled();
  });

  it.each(['2', '9'])('%s: 1 Falha', async (value) => {
    show();
    roll(value);
    await waitFor(() => expect(h.addFailure).toHaveBeenCalledWith('char-1', 0, 1));
  });

  it.each(['10', '19'])('%s: 1 Sucesso', async (value) => {
    show({ death_saves_successes: 1 });
    roll(value);
    await waitFor(() => expect(h.addSuccess).toHaveBeenCalledWith('char-1', 1));
    expect(h.addFailure).not.toHaveBeenCalled();
  });

  it('20 natural: levanta com 1 PV', async () => {
    show({}, 'part-1');
    roll('20');
    await waitFor(() => expect(h.healAndAwake).toHaveBeenCalledWith('char-1', 'part-1', 1));
  });

  // O campo é numérico: "abc" nem chega a ser guardado, e 0 e 21 ficam no campo sem rolar.
  it.each([
    ['0', '0'],
    ['21', '21'],
    ['abc', ''],
  ])('"%s" não faz nada', (value, kept) => {
    show();
    roll(value);
    expect(h.addFailure).not.toHaveBeenCalled();
    expect(h.addSuccess).not.toHaveBeenCalled();
    expect(h.healAndAwake).not.toHaveBeenCalled();
    expect((screen.getByPlaceholderText('Valor 1-20') as HTMLInputElement).value).toBe(kept);
  });

  it('Confirmar fica desligado com o campo vazio e o campo esvazia depois de rolar', async () => {
    show();
    const confirm = screen.getByRole('button', { name: 'Confirmar' }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    roll('12');
    await waitFor(() => expect(h.addSuccess).toHaveBeenCalled());
    expect((screen.getByPlaceholderText('Valor 1-20') as HTMLInputElement).value).toBe('');
  });

  it('Rolar Auto sorteia um d20 e aplica o resultado', async () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Rolar Auto' }));
    await waitFor(() => expect(h.addFailure).toHaveBeenCalledWith('char-1', 0, 2));
    random.mockRestore();
  });
});
