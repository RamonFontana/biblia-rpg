// A Barra do Mestre: os comandos da mesa embaixo da tela, com os nomes acessíveis de sempre.
// O avanço e o fim do combate leem o banco e gravam, então os dois botões esperam um ao outro.
// Termos: CONTEXT.md (Barra do Mestre, Combate).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getSession: async () => ({ data: { session: null } }),
    },
  },
}));

import { useCombatStore } from '@/store/combatStore';
import { MasterBar } from './MasterBar';

const nextTurn = vi.fn();
const endCombat = vi.fn();
const handlers = {
  onOpenTest: vi.fn(),
  onOpenCombat: vi.fn(),
  onAdvanceTime: vi.fn(),
  onOpenRest: vi.fn(),
  onOpenDice: vi.fn(),
};

const inCombat = () =>
  useCombatStore.setState({
    activeCombat: {
      id: 'c1',
      session_id: 's',
      round_number: 1,
      current_turn_index: 0,
      status: 'active',
      created_at: '',
      updated_at: '',
    },
    nextTurn,
    endCombat,
  });

const show = () => render(<MasterBar {...handlers} />);
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  useCombatStore.setState({ activeCombat: null });
});

const pending = () => {
  let finish: () => void = () => {};
  let fail: (reason: unknown) => void = () => {};
  const promise = new Promise<void>((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });
  return { promise, finish, fail };
};

describe('MasterBar: os comandos', () => {
  it('é a região "Barra do Mestre"', () => {
    show();
    expect(screen.getByRole('region', { name: 'Barra do Mestre' })).toBeInTheDocument();
  });

  it('sem combate: Solicitar Teste, Iniciar Combate, Avançar Tempo, Descanso e Dados', () => {
    show();
    for (const [name, handler] of [
      ['Solicitar Teste', handlers.onOpenTest],
      ['Iniciar Combate', handlers.onOpenCombat],
      ['Avançar Tempo', handlers.onAdvanceTime],
      ['Descanso', handlers.onOpenRest],
      ['Dados', handlers.onOpenDice],
    ] as const) {
      fireEvent.click(button(name));
      expect(handler).toHaveBeenCalledTimes(1);
    }
    expect(screen.queryByRole('button', { name: 'Próximo Turno' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Finalizar Combate' })).toBeNull();
  });

  it('em combate: Próximo Turno e Finalizar Combate no lugar de Iniciar Combate', async () => {
    inCombat();
    show();
    expect(screen.queryByRole('button', { name: 'Iniciar Combate' })).toBeNull();
    await act(async () => fireEvent.click(button('Próximo Turno')));
    await act(async () => fireEvent.click(button('Finalizar Combate')));
    expect(nextTurn).toHaveBeenCalledTimes(1);
    expect(endCombat).toHaveBeenCalledTimes(1);
  });
});

describe('MasterBar: enquanto grava', () => {
  it('Próximo Turno e Finalizar Combate ficam desabilitados até o avanço terminar', async () => {
    const turn = pending();
    nextTurn.mockReturnValue(turn.promise);
    inCombat();
    show();

    await act(async () => fireEvent.click(button('Próximo Turno')));
    expect(button('Próximo Turno').disabled).toBe(true);
    expect(button('Finalizar Combate').disabled).toBe(true);
    await act(async () => fireEvent.click(button('Próximo Turno')));
    expect(nextTurn).toHaveBeenCalledTimes(1);

    await act(async () => turn.finish());
    expect(button('Próximo Turno').disabled).toBe(false);
    expect(button('Finalizar Combate').disabled).toBe(false);
  });

  it('Finalizar Combate trava os dois botões enquanto grava', async () => {
    const ending = pending();
    endCombat.mockReturnValue(ending.promise);
    inCombat();
    show();

    await act(async () => fireEvent.click(button('Finalizar Combate')));
    expect(button('Próximo Turno').disabled).toBe(true);
    await act(async () => fireEvent.click(button('Finalizar Combate')));
    expect(endCombat).toHaveBeenCalledTimes(1);
    await act(async () => ending.finish());
  });

  it('se o avanço falhar, registra o erro e libera os botões', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const turn = pending();
    nextTurn.mockReturnValue(turn.promise);
    inCombat();
    show();

    await act(async () => fireEvent.click(button('Próximo Turno')));
    await act(async () => turn.fail(new Error('sem rede')));

    expect(error).toHaveBeenCalledWith('Erro ao avançar o turno:', expect.any(Error));
    expect(button('Próximo Turno').disabled).toBe(false);
  });

  it('se finalizar falhar, registra o erro e libera os botões', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const ending = pending();
    endCombat.mockReturnValue(ending.promise);
    inCombat();
    show();

    await act(async () => fireEvent.click(button('Finalizar Combate')));
    await act(async () => ending.fail(new Error('sem rede')));

    expect(error).toHaveBeenCalledWith('Erro ao finalizar o combate:', expect.any(Error));
    expect(button('Finalizar Combate').disabled).toBe(false);
  });
});

describe('MasterBar: Agir como', () => {
  const npcs = [
    { id: 'n1', name: 'Raabe' },
    { id: 'n2', name: 'Calebe' },
  ];

  it('sem NPC jogável, não há seletor', () => {
    render(<MasterBar {...handlers} />);
    expect(screen.queryByLabelText('Agir como')).toBeNull();
  });

  it('o seletor lista os NPCs jogáveis e avisa a escolha', () => {
    const onActAs = vi.fn();
    render(<MasterBar {...handlers} npcs={npcs} actingAs={undefined} onActAs={onActAs} />);
    const select = screen.getByLabelText('Agir como') as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.text)).toEqual(['Ninguém', 'Raabe', 'Calebe']);
    fireEvent.change(select, { target: { value: 'n2' } });
    expect(onActAs).toHaveBeenCalledWith('n2');
    fireEvent.change(select, { target: { value: '' } });
    expect(onActAs).toHaveBeenLastCalledWith(undefined);
  });

  it('no turno do NPC o seletor mostra quem age e fica travado', () => {
    render(<MasterBar {...handlers} npcs={npcs} actingAs="n1" actAsLocked onActAs={() => {}} />);
    const select = screen.getByLabelText('Agir como') as HTMLSelectElement;
    expect(select.value).toBe('n1');
    expect(select.disabled).toBe(true);
  });
});

describe('MasterBar: Comandos no celular', () => {
  it('recolhida, só o botão Comandos aparece; abrir mostra os comandos de sempre', () => {
    render(<MasterBar {...handlers} collapsible />);
    const toggle = button('Comandos');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: 'Solicitar Teste' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Dados' })).toBeNull();
    fireEvent.click(toggle);
    expect(button('Comandos').getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(button('Solicitar Teste'));
    expect(handlers.onOpenTest).toHaveBeenCalled();
    expect(button('Dados')).toBeTruthy();
  });

  it('o seletor Agir como fica à vista com os comandos recolhidos', () => {
    render(
      <MasterBar
        {...handlers}
        collapsible
        npcs={[{ id: 'n1', name: 'Raabe' }]}
        onActAs={() => {}}
      />,
    );
    expect(screen.getByLabelText('Agir como')).toBeTruthy();
  });

  it('sem `collapsible`, não há botão Comandos', () => {
    render(<MasterBar {...handlers} />);
    expect(screen.queryByRole('button', { name: 'Comandos' })).toBeNull();
  });
});
