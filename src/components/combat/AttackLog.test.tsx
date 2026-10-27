// A lista dos últimos ataques do combate, para o Mestre: quem atacou quem, o d20, o total contra a
// CA, o resultado e o dano. Termos: CONTEXT.md (Ataque, Acerto Crítico, Falha Crítica, CA).
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { CombatAttack } from '@/data-access/combat';
import { AttackLog } from './AttackLog';

afterEach(cleanup);

const attack = (over: Partial<CombatAttack> = {}): CombatAttack => ({
  id: 'a1',
  combat_id: 'c1',
  attacker_participant_id: 'p1',
  target_participant_id: 'p2',
  attacker_name: 'Eliabe',
  target_name: 'Filisteu',
  natural_roll: 14,
  total: 19,
  target_ac: 15,
  hit: true,
  critical: false,
  fumble: false,
  damage: 7,
  target_hp_before: 12,
  target_hp_after: 5,
  created_at: '2026-10-27T10:00:00Z',
  ...over,
});

describe('AttackLog', () => {
  it('sem ataques, não aparece', () => {
    const { container } = render(<AttackLog attacks={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('um acerto mostra os nomes, o d20, o total contra a CA, o dano e o PV', () => {
    render(<AttackLog attacks={[attack()]} />);
    const row = screen.getByRole('listitem');
    expect(row).toHaveTextContent('Eliabe → Filisteu');
    expect(row).toHaveTextContent('d20 14');
    expect(row).toHaveTextContent('19 contra CA 15');
    expect(row).toHaveTextContent('Acertou');
    expect(row).toHaveTextContent('7 de dano');
    expect(row).toHaveTextContent('PV 12 → 5');
  });

  it('um erro não mostra dano', () => {
    render(<AttackLog attacks={[attack({ hit: false, damage: 0, total: 11 })]} />);
    const row = screen.getByRole('listitem');
    expect(row).toHaveTextContent('Errou');
    expect(row).not.toHaveTextContent('de dano');
  });

  it('marca o Acerto Crítico e a Falha Crítica', () => {
    render(
      <AttackLog
        attacks={[
          attack({ id: 'a1', critical: true, natural_roll: 20 }),
          attack({ id: 'a2', hit: false, fumble: true, natural_roll: 1, damage: 0 }),
        ]}
      />,
    );
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Acerto Crítico');
    expect(rows[1]).toHaveTextContent('Falha Crítica');
  });

  it('mantém a ordem recebida (do mais novo para o mais antigo)', () => {
    render(
      <AttackLog attacks={[attack({ id: 'a2', attacker_name: 'Rute' }), attack({ id: 'a1' })]} />,
    );
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Rute');
    expect(rows[1]).toHaveTextContent('Eliabe');
  });
});
