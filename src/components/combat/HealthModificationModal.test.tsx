// A janela de dano e cura do Mestre: o valor vai para o armazém de combate e, se gravou, a janela
// avisa (`onApplied`) antes de fechar. Termos: CONTEXT.md (Combate).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({ applyDamageOrHealing: vi.fn() }));

vi.mock('../../store/combatStore', () => ({
  useCombatStore: (
    select: (state: { applyDamageOrHealing: typeof h.applyDamageOrHealing }) => unknown,
  ) => select({ applyDamageOrHealing: h.applyDamageOrHealing }),
}));

import { HealthModificationModal } from './HealthModificationModal';

const PARTICIPANT = '0b0c0d0e-1111-4222-8333-444455556666';
const onClose = vi.fn();
const onApplied = vi.fn();

const open = () =>
  render(
    <HealthModificationModal
      isOpen
      onClose={onClose}
      onApplied={onApplied}
      participantId={PARTICIPANT}
      participantName="Guarda"
    />,
  );
const apply = (amount: string) => {
  fireEvent.change(screen.getByLabelText('Valor'), { target: { value: amount } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
};

beforeEach(() => {
  h.applyDamageOrHealing.mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('HealthModificationModal', () => {
  it('aplica o dano ao participante, avisa que aplicou e fecha', async () => {
    open();
    apply('4');

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(h.applyDamageOrHealing).toHaveBeenCalledWith(PARTICIPANT, 4, 'damage');
    expect(onApplied).toHaveBeenCalledTimes(1);
  });

  it('avisa que aplicou antes de fechar', async () => {
    const order: string[] = [];
    onApplied.mockImplementation(() => order.push('applied'));
    onClose.mockImplementation(() => order.push('close'));
    open();
    apply('4');

    await waitFor(() => expect(order).toEqual(['applied', 'close']));
  });

  it('se gravar falhar, registra o erro, não avisa e não fecha', async () => {
    h.applyDamageOrHealing.mockRejectedValue(new Error('sem rede'));
    open();
    apply('4');

    await waitFor(() =>
      expect(console.error).toHaveBeenCalledWith('Failed to modify health', expect.any(Error)),
    );
    expect(onApplied).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('valor zero é recusado pelo formulário e nada é aplicado', async () => {
    open();
    apply('0');

    expect(await screen.findByText('O valor deve ser maior que zero')).toBeInTheDocument();
    expect(h.applyDamageOrHealing).not.toHaveBeenCalled();
    expect(onApplied).not.toHaveBeenCalled();
  });
});
