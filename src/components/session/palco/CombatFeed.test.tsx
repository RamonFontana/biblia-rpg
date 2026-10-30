// O feed do Palco: os 3 últimos eventos do combate; tocar abre o Histórico.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import type { CombatAttack } from '@/data-access/combat';
import { CombatFeed } from './CombatFeed';

const attack = (id: string, at: string, over: Partial<CombatAttack> = {}): CombatAttack =>
  ({
    id,
    created_at: at,
    attacker_name: 'Guarda',
    target_name: 'Eliabe',
    hit: true,
    critical: false,
    fumble: false,
    damage: 5,
    ...over,
  }) as CombatAttack;

afterEach(cleanup);

describe('CombatFeed', () => {
  it('sem eventos não aparece', () => {
    render(<CombatFeed attacks={[]} abilityUses={[]} onOpen={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Histórico/ })).toBeNull();
  });

  it('mostra os eventos e tocar abre o Histórico', () => {
    const onOpen = vi.fn();
    render(
      <CombatFeed
        attacks={[attack('a1', '2026-01-01T10:00:01Z')]}
        abilityUses={[]}
        onOpen={onOpen}
      />,
    );
    const button = screen.getByRole('button', { name: /Abrir o Histórico/ });
    expect(button).toHaveTextContent('Guarda acertou Eliabe: 5 de dano');
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('sem onOpen, o feed só lê: os eventos aparecem e não há botão', () => {
    render(<CombatFeed attacks={[attack('a1', '2026-01-01T10:00:01Z')]} abilityUses={[]} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('region', { name: 'Últimos eventos do combate' })).toHaveTextContent(
      'Guarda acertou Eliabe: 5 de dano',
    );
  });
});
