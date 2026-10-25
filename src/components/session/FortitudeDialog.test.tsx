// A Fortaleza: o Mestre dá +1d4 de Fé ao jogador que agiu pela sua virtude. O d4 é o dado físico
// digitado ou a Rolagem Virtual. Termos: CONTEXT.md (Fortaleza). Regras: docs/regras-base.md, 4.1.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@/lib/systemRng', () => ({ systemRng: () => Math.random() }));

import { FortitudeDialog } from './FortitudeDialog';

const onApply = vi.fn();
const onClose = vi.fn();

const show = (fortress: string | null | undefined = 'Coragem') =>
  render(
    <FortitudeDialog
      isOpen
      characterName="Eliabe"
      fortress={fortress}
      onApply={onApply}
      onClose={onClose}
    />,
  );
const type = (value: string) =>
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value } });
const apply = () => fireEvent.click(screen.getByRole('button', { name: /Aplicar/ }));

beforeEach(() => {
  onApply.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('FortitudeDialog', () => {
  it('fechado, não desenha nada', () => {
    render(
      <FortitudeDialog
        isOpen={false}
        characterName="Eliabe"
        fortress="Coragem"
        onApply={onApply}
        onClose={onClose}
      />,
    );
    expect(screen.queryByText(/Fortaleza/)).toBeNull();
  });

  it('mostra o personagem e o nome da Fortaleza', () => {
    show('Coragem');
    expect(screen.getByText(/Eliabe/)).toBeInTheDocument();
    expect(screen.getByText('Coragem')).toBeInTheDocument();
  });

  it('sem Fortaleza registrada, avisa e ainda deixa aplicar', () => {
    show(null);
    expect(screen.getByText(/Sem Fortaleza registrada/)).toBeInTheDocument();
  });

  it('aplica o d4 digitado e fecha', async () => {
    show();
    type('3');
    apply();
    await waitFor(() => expect(onApply).toHaveBeenCalledWith(3));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it.each([
    ['', /Insira o resultado do d4/],
    ['0', /entre 1 e 4/],
    ['5', /entre 1 e 4/],
  ])('o d4 "%s" é recusado e nada é aplicado', (value, message) => {
    show();
    type(value);
    apply();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('a Rolagem Virtual preenche o d4 sem aplicar sozinha', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // 1 + floor(0,5 × 4) = 3
    show();
    fireEvent.click(screen.getByRole('button', { name: /Rolar 1d4/ }));
    expect(screen.getByRole('spinbutton')).toHaveValue(3);
    expect(onApply).not.toHaveBeenCalled();
  });

  it('a falha ao aplicar mostra o erro e não fecha', async () => {
    onApply.mockRejectedValue(new Error('falhou'));
    show();
    type('2');
    apply();
    expect(await screen.findByText(/Não foi possível aplicar/)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Cancelar fecha sem aplicar', () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
  });
});
