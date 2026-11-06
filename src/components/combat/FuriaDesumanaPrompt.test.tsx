// A Fúria Desumana na tela do Mestre: o pedido de TR de CON quando o inimigo cai a 0 PV.
// Termos: CONTEXT.md (Fúria Desumana).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/services/furiaService', () => ({
  resolveFuriaSave: vi.fn(),
  releaseFuria: vi.fn().mockResolvedValue(undefined),
}));

import { releaseFuria, resolveFuriaSave } from '@/services/furiaService';
import { FuriaDesumanaPrompt, type FuriaEnemy } from './FuriaDesumanaPrompt';

const fury = [{ name: 'Fúria Desumana', description: 'x' }];
const enemy = (over: Partial<FuriaEnemy> = {}): FuriaEnemy => ({
  participantId: 'p1',
  entityId: 'e1',
  name: 'Legião',
  hp: 0,
  skills: fury,
  abilityState: null,
  ...over,
});

beforeEach(() => {
  vi.mocked(resolveFuriaSave).mockResolvedValue({
    cd: 10,
    total: 13,
    passed: true,
    hpAfter: 1,
    state: { uses: 1, handled: false },
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('FuriaDesumanaPrompt', () => {
  it('pede o TR de CON com a CD 10 quando o inimigo com a Fúria cai a 0 PV', () => {
    render(<FuriaDesumanaPrompt enemies={[enemy()]} />);
    expect(screen.getByRole('heading', { name: 'Fúria Desumana' })).toBeInTheDocument();
    expect(screen.getByText(/Legião caiu a 0 PV · TR de Constituição · CD 10/)).toBeInTheDocument();
  });

  it('a CD sobe 5 a cada uso no combate', () => {
    render(
      <FuriaDesumanaPrompt
        enemies={[enemy({ abilityState: { furia: { uses: 2, handled: false } } })]}
      />,
    );
    expect(screen.getByText(/CD 20/)).toBeInTheDocument();
  });

  it('não pede com PV acima de 0, sem a Fúria, nem para o mesmo 0 PV já tratado', () => {
    render(
      <FuriaDesumanaPrompt
        enemies={[
          enemy({ participantId: 'a', hp: 3 }),
          enemy({ participantId: 'b', skills: [{ name: 'Ataque Furtivo', description: '' }] }),
          enemy({ participantId: 'c', abilityState: { furia: { uses: 0, handled: true } } }),
        ]}
      />,
    );
    expect(screen.queryByRole('heading', { name: 'Fúria Desumana' })).toBeNull();
  });

  it('só habilita Aplicar com um d20 entre 1 e 20', () => {
    render(<FuriaDesumanaPrompt enemies={[enemy()]} />);
    const apply = screen.getByRole('button', { name: 'Aplicar Fúria Desumana' });
    expect(apply).toBeDisabled();
    fireEvent.change(screen.getByLabelText('d20 de Legião'), { target: { value: '21' } });
    expect(apply).toBeDisabled();
    fireEvent.change(screen.getByLabelText('d20 de Legião'), { target: { value: '13' } });
    expect(apply).toBeEnabled();
  });

  it('aplica o d20 digitado e avisa o resultado', async () => {
    render(<FuriaDesumanaPrompt enemies={[enemy()]} />);
    fireEvent.change(screen.getByLabelText('d20 de Legião'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar Fúria Desumana' }));
    await waitFor(() =>
      expect(resolveFuriaSave).toHaveBeenCalledWith(
        expect.objectContaining({ participantId: 'p1', entityId: 'e1' }),
        { natural: 10, mark: null },
      ),
    );
    expect(
      await screen.findByText('Legião passou no TR de CON (13 contra CD 10) e fica com 1 PV.'),
    ).toBeInTheDocument();
  });

  it('a falha avisa que o inimigo segue a 0 PV', async () => {
    vi.mocked(resolveFuriaSave).mockResolvedValue({
      cd: 10,
      total: 6,
      passed: false,
      hpAfter: 0,
      state: { uses: 0, handled: true },
    });
    render(<FuriaDesumanaPrompt enemies={[enemy()]} />);
    fireEvent.change(screen.getByLabelText('d20 de Legião'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar Fúria Desumana' }));
    expect(
      await screen.findByText('Legião falhou no TR de CON (6 contra CD 10) e segue a 0 PV.'),
    ).toBeInTheDocument();
  });

  it('a Rolagem Virtual preenche o d20, como no TR de Habilidade', () => {
    render(<FuriaDesumanaPrompt enemies={[enemy()]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Rolagem Virtual de Legião' }));
    const value = Number((screen.getByLabelText('d20 de Legião') as HTMLInputElement).value);
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(20);
    expect(screen.getByText(/Rolou \d+\./)).toBeInTheDocument();
  });

  it('mostra o erro do serviço', async () => {
    vi.mocked(resolveFuriaSave).mockRejectedValue(new Error('sem rede'));
    render(<FuriaDesumanaPrompt enemies={[enemy()]} />);
    fireEvent.change(screen.getByLabelText('d20 de Legião'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar Fúria Desumana' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('sem rede');
  });

  it('libera o próximo pedido quando o inimigo tem PV de novo', () => {
    render(<FuriaDesumanaPrompt enemies={[enemy({ hp: 1 })]} />);
    expect(releaseFuria).toHaveBeenCalledWith(expect.objectContaining({ participantId: 'p1' }), 1);
  });
});
