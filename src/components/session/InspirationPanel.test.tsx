// A Inspiração na tela do jogador: disponível para o Inabalável que não a gastou hoje; o botão
// "Usei a Inspiração" a marca (para uma rolagem fora do Teste do app). Termos: CONTEXT.md
// (Inspiração, Estado de Fé).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({ markInspirationUsed: vi.fn() }));
vi.mock('@/data-access/characters', () => ({ markInspirationUsed: h.markInspirationUsed }));

import type { Character } from '@/features/character-management/types';
import { InspirationPanel } from './InspirationPanel';

const character = (over: Partial<Character> = {}): Character =>
  ({
    id: 'c1',
    stats: { current_faith: 80, faith: 50 },
    inspiration_used_day: null,
    inspiration_session_id: null,
    ...over,
  }) as Character;

const onUsed = vi.fn();
const show = (c: Character, day = 3) =>
  render(<InspirationPanel character={c} sessionId="s1" day={day} onUsed={onUsed} />);

beforeEach(() => {
  h.markInspirationUsed.mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('InspirationPanel', () => {
  it('Inabalável que não a usou: mostra "Inspiração disponível" e o botão', () => {
    show(character());
    expect(screen.getByText('Inspiração disponível')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usei a Inspiração' })).toBeInTheDocument();
  });

  it('usar marca o dia e avisa a tela', async () => {
    show(character());
    fireEvent.click(screen.getByRole('button', { name: 'Usei a Inspiração' }));
    await waitFor(() => expect(h.markInspirationUsed).toHaveBeenCalledWith('c1', 's1', 3));
    await waitFor(() =>
      expect(onUsed).toHaveBeenCalledWith({
        inspiration_used_day: 3,
        inspiration_session_id: 's1',
      }),
    );
  });

  it('usada hoje: mostra "Inspiração usada hoje", sem botão', () => {
    show(character({ inspiration_used_day: 3, inspiration_session_id: 's1' }));
    expect(screen.getByText('Inspiração usada hoje')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Usei a Inspiração' })).toBeNull();
  });

  it('o dia novo a devolve', () => {
    show(character({ inspiration_used_day: 3, inspiration_session_id: 's1' }), 4);
    expect(screen.getByText('Inspiração disponível')).toBeInTheDocument();
  });

  it('fora do Inabalável e sem uso hoje, não mostra nada', () => {
    const { container } = show(character({ stats: { current_faith: 40, faith: 50 } as never }));
    expect(container).toBeEmptyDOMElement();
  });

  it('se marcar falha, mostra o erro e não avisa a tela', async () => {
    h.markInspirationUsed.mockRejectedValue(new Error('falhou'));
    show(character());
    fireEvent.click(screen.getByRole('button', { name: 'Usei a Inspiração' }));
    expect(await screen.findByText(/Não foi possível marcar/)).toBeInTheDocument();
    expect(onUsed).not.toHaveBeenCalled();
  });
});
