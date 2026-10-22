// CARACTERIZAÇÃO: o cartão do inimigo na cena: PV, CA e o estado de derrotado. O PV vem do
// participante do combate quando há um, senão da ficha. Decisões: ROADMAP.md, Onda 4, passo 7f.
// Termos: CONTEXT.md (Inimigo, PV, CA).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Character } from '@/features/character-management/types';
import { EnemyCard } from './EnemyCard';

afterEach(cleanup);

const enemy = (over: Partial<Character> = {}): Character => ({
  id: 'e1',
  user_id: 'u1',
  name: 'Filisteu',
  vocation: 'Guerreiro',
  is_enemy: true,
  has_participated_in_session: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  stats: { pv: 20, current_pv: 14, ca: 13, faith: 0 },
  ...over,
});

const card = () => screen.getByRole('heading', { name: /Filisteu/ }).closest('.cursor-pointer')!;

describe('EnemyCard', () => {
  it('mostra o nome, a vocação, o PV atual e máximo e a CA da ficha', () => {
    render(<EnemyCard enemy={enemy()} />);
    expect(screen.getByText('Filisteu')).toBeInTheDocument();
    expect(screen.getByText('Guerreiro')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('/20')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
  });

  it('sem vocação mostra "Inimigo"; sem CA, 10', () => {
    render(
      <EnemyCard
        enemy={enemy({ vocation: undefined, stats: { pv: 20, current_pv: 14, faith: 0 } as never })}
      />,
    );
    expect(screen.getByText('Inimigo')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('o PV do participante do combate vale mais que o da ficha', () => {
    render(<EnemyCard enemy={enemy()} participant={{ hp_current: 3 }} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('14')).toBeNull();
  });

  it('o participante com PV 0 conta (não cai para a ficha) e o cartão fica apagado', () => {
    render(<EnemyCard enemy={enemy()} participant={{ hp_current: 0 }} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(card().className).toMatch(/opacity-50/);
  });

  it('com PV acima de 0 o cartão não fica apagado', () => {
    render(<EnemyCard enemy={enemy()} />);
    expect(card().className).not.toMatch(/opacity-50/);
  });

  it('o clique chama onClick', () => {
    const onClick = vi.fn();
    render(<EnemyCard enemy={enemy()} onClick={onClick} />);
    fireEvent.click(card());
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
