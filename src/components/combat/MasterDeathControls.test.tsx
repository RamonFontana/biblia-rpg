// CARACTERIZAÇÃO: os controles de morte do Mestre num personagem: o estado lido do banco, quais
// botões ficam liberados em cada estado e o que cada um chama. Decisões: ROADMAP.md, Onda 4,
// passo 6c-5. Termos: CONTEXT.md (Teste de Morte, Estável, Morto).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  getCharacterDeathState: vi.fn(),
  subscribeToCharacterUpdates: vi.fn(),
  addSuccess: vi.fn(),
  addFailure: vi.fn(),
  healAndAwake: vi.fn(),
  killInstant: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock('@/data-access/characters', () => ({
  getCharacterDeathState: h.getCharacterDeathState,
  subscribeToCharacterUpdates: h.subscribeToCharacterUpdates,
}));
vi.mock('../../hooks/useDeathSaves', () => ({
  useDeathSaves: () => ({
    addSuccess: h.addSuccess,
    addFailure: h.addFailure,
    healAndAwake: h.healAndAwake,
    killInstant: h.killInstant,
  }),
}));

import { MasterDeathControls } from './MasterDeathControls';

beforeEach(() => {
  Object.values(h).forEach((fn) => fn.mockReset());
  h.subscribeToCharacterUpdates.mockReturnValue(h.unsubscribe);
});
afterEach(cleanup);

const state = (over: Record<string, unknown> = {}) => ({
  death_saves_successes: 0,
  death_saves_failures: 0,
  is_stable: false,
  is_dead: false,
  ...over,
});
const show = async (over: Record<string, unknown> = {}, participantId?: string) => {
  h.getCharacterDeathState.mockResolvedValue(state(over));
  render(<MasterDeathControls characterId="char-1" participantId={participantId} />);
  await screen.findByText('Controles de Morte (Mestre)');
};
const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;

describe('MasterDeathControls: estado', () => {
  it('não desenha nada até o estado chegar', () => {
    h.getCharacterDeathState.mockReturnValue(new Promise(() => {}));
    const { container } = render(<MasterDeathControls characterId="char-1" />);
    expect(container.firstChild).toBeNull();
  });

  it('lê o estado do personagem e assina as mudanças; ao sair, cancela a assinatura', async () => {
    h.getCharacterDeathState.mockResolvedValue(state());
    const { unmount } = render(<MasterDeathControls characterId="char-1" />);
    await screen.findByText('Controles de Morte (Mestre)');
    expect(h.getCharacterDeathState).toHaveBeenCalledWith('char-1');
    expect(h.subscribeToCharacterUpdates).toHaveBeenCalledWith('char-1', expect.any(Function));
    unmount();
    expect(h.unsubscribe).toHaveBeenCalled();
  });

  it('mostra Sucessos, Falhas, Estável e Morto', async () => {
    await show({ death_saves_successes: 2, death_saves_failures: 1, is_stable: true });
    expect(screen.getByText('Sucessos: 2')).toBeTruthy();
    expect(screen.getByText('Falhas: 1')).toBeTruthy();
    expect(screen.getByText('Estável: Sim')).toBeTruthy();
    expect(screen.getByText('Morto: Não')).toBeTruthy();
  });

  it('uma mudança vinda da assinatura atualiza a tela', async () => {
    await show();
    const push = h.subscribeToCharacterUpdates.mock.calls[0][1] as (s: unknown) => void;
    push(state({ is_dead: true, death_saves_failures: 3 }));
    await waitFor(() => expect(screen.getByText('Morto: Sim')).toBeTruthy());
    expect(screen.getByText('Falhas: 3')).toBeTruthy();
  });
});

describe('MasterDeathControls: botões', () => {
  it('morrendo: todos liberados', async () => {
    await show();
    for (const name of ['+1 Sucesso', '+1 Falha', 'Levantar (+1 PV)', 'Morte Instantânea']) {
      expect(button(name).disabled).toBe(false);
    }
  });

  it('estável: não soma Sucesso, mas ainda soma Falha, levanta e mata', async () => {
    await show({ is_stable: true });
    expect(button('+1 Sucesso').disabled).toBe(true);
    expect(button('+1 Falha').disabled).toBe(false);
    expect(button('Levantar (+1 PV)').disabled).toBe(false);
    expect(button('Morte Instantânea').disabled).toBe(false);
  });

  it('morto: nenhum botão', async () => {
    await show({ is_dead: true });
    for (const name of ['+1 Sucesso', '+1 Falha', 'Levantar (+1 PV)', 'Morte Instantânea']) {
      expect(button(name).disabled).toBe(true);
    }
  });

  it('cada botão chama a ação certa com os números atuais', async () => {
    await show({ death_saves_successes: 1, death_saves_failures: 2 }, 'part-1');
    fireEvent.click(button('+1 Sucesso'));
    fireEvent.click(button('+1 Falha'));
    fireEvent.click(button('Levantar (+1 PV)'));
    fireEvent.click(button('Morte Instantânea'));
    expect(h.addSuccess).toHaveBeenCalledWith('char-1', 1);
    expect(h.addFailure).toHaveBeenCalledWith('char-1', 2);
    expect(h.healAndAwake).toHaveBeenCalledWith('char-1', 'part-1', 1);
    expect(h.killInstant).toHaveBeenCalledWith('char-1');
  });

  it('o botão de Sucesso e o de Falha não têm a mesma aparência', async () => {
    await show();
    expect(button('+1 Sucesso').className).not.toBe(button('+1 Falha').className);
  });
});
