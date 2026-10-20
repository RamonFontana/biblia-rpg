// CARACTERIZAÇÃO: o cartão de uma Habilidade: nome, tipo de ação (cada um com texto próprio; a cor
// é só reforço), rótulo de uso, quando "Usar" está liberado e quando o Mestre pode restaurar.
// Decisões: ROADMAP.md, Onda 4, passo 6c-5. Termos: CONTEXT.md (Habilidade, Fé).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import type { AbilityDefinition } from '@/content/schemas';
import { AbilityCard } from './AbilityCard';

afterEach(cleanup);

const ability = (over: Partial<AbilityDefinition> = {}): AbilityDefinition => ({
  id: 'tribe-juda-leao',
  name: 'Rugido do Leão',
  sourceType: 'tribe',
  sourceId: 'juda',
  minLevel: 1,
  actionType: 'action',
  usageType: 'unlimited',
  effect: 'Todos os aliados ganham coragem.',
  ...over,
});

describe('AbilityCard: o que mostra', () => {
  it('nome e efeito', () => {
    render(<AbilityCard ability={ability()} />);
    expect(screen.getByText('Rugido do Leão')).toBeTruthy();
    expect(screen.getByText('Todos os aliados ganham coragem.')).toBeTruthy();
  });

  it('o Caminho só aparece quando a Habilidade tem um', () => {
    const { rerender } = render(<AbilityCard ability={ability()} />);
    expect(screen.queryByText(/Caminho/)).toBeNull();
    rerender(<AbilityCard ability={ability({ path: 'B' })} />);
    expect(screen.getByText('Caminho B')).toBeTruthy();
  });

  it.each([
    ['action', 'Ação'],
    ['bonus_action', 'Ação Bônus'],
    ['reaction', 'Reação'],
    ['free_action', 'Ação Livre'],
    ['passive', 'Passiva'],
  ] as const)('o tipo %s se chama "%s"', (actionType, label) => {
    render(<AbilityCard ability={ability({ actionType })} />);
    expect(screen.getByText(label)).toBeTruthy();
  });

  it('a Passiva não se parece com uma ação', () => {
    render(<AbilityCard ability={ability({ actionType: 'passive' })} />);
    const passive = screen.getByText('Passiva').className;
    cleanup();
    render(<AbilityCard ability={ability({ actionType: 'action' })} />);
    expect(screen.getByText('Ação').className).not.toBe(passive);
  });
});

describe('AbilityCard: rótulo de uso', () => {
  const label = (over: Partial<AbilityDefinition>, currentUses?: number) => {
    render(<AbilityCard ability={ability(over)} currentUses={currentUses} />);
  };

  it('ilimitada não mostra rótulo de uso', () => {
    label({ usageType: 'unlimited' });
    expect(screen.queryByText(/D\. Curto|D\. Longo|Combate|Semana|Campanha|Custo/)).toBeNull();
  });

  it('custo em Fé', () => {
    label({ usageType: 'faith_cost', faithCost: 5 });
    expect(screen.getByText('Custo: 5 Fé')).toBeTruthy();
  });

  it.each([
    ['short_rest', 'D. Curto'],
    ['long_rest', 'D. Longo'],
    ['combat', 'Combate'],
    ['week', 'Semana'],
    ['campaign', 'Campanha'],
  ] as const)('%s mostra usos que restam e o período', (usageType, period) => {
    label({ usageType, maxUses: 3 }, 2);
    expect(screen.getByText(`2/3 ${period}`)).toBeTruthy();
  });

  it('sem a contagem atual, mostra todos os usos', () => {
    label({ usageType: 'long_rest', maxUses: 2 });
    expect(screen.getByText('2/2 D. Longo')).toBeTruthy();
  });

  it('com usos e custo em Fé, mostra os dois', () => {
    label({ usageType: 'short_rest', maxUses: 1, faithCost: 10 }, 1);
    expect(screen.getByText('1/1 D. Curto (Custo: 10 Fé)')).toBeTruthy();
  });
});

describe('AbilityCard: Usar', () => {
  const use = vi.fn();
  const show = (over: Partial<AbilityDefinition>, props: Record<string, unknown> = {}) => {
    use.mockClear();
    render(<AbilityCard ability={ability(over)} onUse={use} {...props} />);
  };
  const button = () => screen.getByRole('button', { name: 'Usar' }) as HTMLButtonElement;

  it('liberado numa Habilidade ilimitada; chama onUse com ela', () => {
    show({});
    expect(button().disabled).toBe(false);
    fireEvent.click(button());
    expect(use).toHaveBeenCalledWith(expect.objectContaining({ id: 'tribe-juda-leao' }));
  });

  it('a Passiva não tem botão', () => {
    show({ actionType: 'passive' });
    expect(screen.queryByRole('button', { name: 'Usar' })).toBeNull();
  });

  it('sem onUse não há botão', () => {
    render(<AbilityCard ability={ability()} />);
    expect(screen.queryByRole('button', { name: 'Usar' })).toBeNull();
  });

  it('sem usos (0) numa Habilidade limitada, o botão fica desligado', () => {
    show({ usageType: 'long_rest', maxUses: 2 }, { currentUses: 0 });
    expect(button().disabled).toBe(true);
  });

  it('0 usos não trava a ilimitada nem a de custo em Fé', () => {
    show({ usageType: 'unlimited' }, { currentUses: 0 });
    expect(button().disabled).toBe(false);
    cleanup();
    show({ usageType: 'faith_cost', faithCost: 5 }, { currentUses: 0 });
    expect(button().disabled).toBe(false);
  });

  it('com usos sobrando, o botão está liberado', () => {
    show({ usageType: 'long_rest', maxUses: 2 }, { currentUses: 1 });
    expect(button().disabled).toBe(false);
  });

  it('disabled desliga o botão e mostra o motivo', () => {
    show({}, { disabled: true, disabledReason: 'Fé Insuficiente' });
    expect(button().disabled).toBe(true);
    expect(screen.getByText('Fé Insuficiente')).toBeTruthy();
  });

  it('o motivo só aparece quando o botão está desligado', () => {
    show({}, { disabledReason: 'Fé Insuficiente' });
    expect(screen.queryByText('Fé Insuficiente')).toBeNull();
  });
});

describe('AbilityCard: Restaurar (Mestre)', () => {
  const restore = vi.fn();
  const show = (props: Record<string, unknown>, over: Partial<AbilityDefinition> = {}) => {
    restore.mockClear();
    render(
      <AbilityCard
        ability={ability({ usageType: 'long_rest', maxUses: 2, ...over })}
        onRestore={restore}
        {...props}
      />,
    );
  };

  it('o Mestre restaura quando faltam usos', () => {
    show({ isGM: true, currentUses: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar' }));
    expect(restore).toHaveBeenCalledWith(expect.objectContaining({ id: 'tribe-juda-leao' }));
  });

  it('o jogador não vê o botão', () => {
    show({ isGM: false, currentUses: 1 });
    expect(screen.queryByRole('button', { name: 'Restaurar' })).toBeNull();
  });

  it('com todos os usos, o botão não aparece', () => {
    show({ isGM: true, currentUses: 2 });
    expect(screen.queryByRole('button', { name: 'Restaurar' })).toBeNull();
  });

  it('sem contagem atual, o botão não aparece', () => {
    show({ isGM: true });
    expect(screen.queryByRole('button', { name: 'Restaurar' })).toBeNull();
  });

  it('numa Habilidade ilimitada, o botão não aparece', () => {
    show({ isGM: true, currentUses: 0 }, { usageType: 'unlimited' });
    expect(screen.queryByRole('button', { name: 'Restaurar' })).toBeNull();
  });
});
