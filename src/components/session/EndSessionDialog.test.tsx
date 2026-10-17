// Fixa a tela de encerrar a sessão: Marco (level-up escolhido pelo Mestre) e o bloqueio enquanto
// alguém estiver Morrendo (decisão do autor: o Mestre resolve os Testes de Morte antes).
// Termos: CONTEXT.md (Marco, Morrendo, Estável).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EndSessionDialog } from './EndSessionDialog';

const pc = (id: string, over: Record<string, unknown> = {}) => ({
  character: {
    id,
    name: id,
    level: 3,
    stats: { pv: 10, current_pv: 10 },
    is_dead: false,
    is_stable: false,
    is_npc: false,
    is_enemy: false,
    is_deleted: false,
    ...over,
  },
});

const renderDialog = (playerCharacters: ReturnType<typeof pc>[], onConfirm = vi.fn()) => {
  render(
    <EndSessionDialog
      isOpen
      onClose={() => {}}
      onConfirm={onConfirm}
      playerCharacters={playerCharacters}
    />,
  );
  return onConfirm;
};
const confirmButton = () => screen.getByRole('button', { name: /Finalizar Sessão/ });

afterEach(cleanup);

describe('EndSessionDialog', () => {
  it('sem ninguém Morrendo, encerra com os personagens escolhidos para subir de nível', () => {
    const onConfirm = renderDialog([pc('Davi'), pc('Rute')]);
    fireEvent.click(screen.getByLabelText(/Rute/));
    fireEvent.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith(['Rute']);
  });

  it('com alguém Morrendo, bloqueia o encerramento e diz quem é', () => {
    const onConfirm = renderDialog([
      pc('Davi'),
      pc('Jonatas', { stats: { pv: 10, current_pv: 0 } }),
    ]);
    expect(confirmButton()).toBeDisabled();
    expect(screen.getByText(/Testes de Morte/)).toHaveTextContent('Jonatas');
    fireEvent.click(confirmButton());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('NPC aliado Morrendo também bloqueia', () => {
    renderDialog([pc('Davi'), pc('Guarda', { is_npc: true, stats: { pv: 8, current_pv: 0 } })]);
    expect(confirmButton()).toBeDisabled();
  });

  it('Estável, Morto ou inimigo com 0 PV não bloqueiam', () => {
    renderDialog([
      pc('Davi'),
      pc('Estavel', { stats: { pv: 10, current_pv: 0 }, is_stable: true }),
      pc('Morto', { stats: { pv: 10, current_pv: 0 }, is_dead: true }),
      pc('Filisteu', { stats: { pv: 8, current_pv: 0 }, is_enemy: true }),
    ]);
    expect(confirmButton()).toBeEnabled();
    expect(screen.queryByText(/Testes de Morte/)).toBeNull();
  });
});
