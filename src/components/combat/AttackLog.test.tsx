// A lista dos últimos ataques do combate, para o Mestre: quem atacou quem, o d20, o total contra a
// CA, o resultado e o dano. Termos: CONTEXT.md (Ataque, Acerto Crítico, Falha Crítica, CA).
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { CombatAbilityUse, CombatAttack } from '@/data-access/combat';
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
  applied_mode: 'normal',
  rolls: null,
  inspiration_used: false,
  weapon_effect_triggered: false,
  weapon_effect_conditions: [],
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

describe('AttackLog: modalidade', () => {
  it('mostra a Vantagem, a Desvantagem e a Inspiração', () => {
    render(
      <AttackLog
        attacks={[
          attack({ id: 'a1', applied_mode: 'vantagem', inspiration_used: true, rolls: [14, 6] }),
          attack({ id: 'a2', applied_mode: 'desvantagem' }),
        ]}
      />,
    );
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('com Vantagem');
    expect(rows[0]).toHaveTextContent('Inspiração');
    expect(rows[0]).toHaveTextContent('d20 14 e 6');
    expect(rows[1]).toHaveTextContent('com Desvantagem');
  });

  it('o ataque normal não leva etiqueta', () => {
    render(<AttackLog attacks={[attack()]} />);
    expect(screen.getByRole('listitem')).not.toHaveTextContent(/com (Vantagem|Desvantagem)/);
  });
});

describe('AttackLog: efeito de arma', () => {
  it('mostra as Condições que chegaram ao alvo', () => {
    render(
      <AttackLog
        attacks={[
          attack({
            weapon_effect_triggered: true,
            weapon_effect_conditions: [{ conditionId: 'sangrando', duration: 3 }],
          }),
        ]}
      />,
    );
    expect(screen.getByRole('listitem')).toHaveTextContent('Efeito de arma: Sangrando');
  });

  it('mostra o efeito resistido quando nada chegou ao alvo', () => {
    render(<AttackLog attacks={[attack({ weapon_effect_triggered: true })]} />);
    expect(screen.getByRole('listitem')).toHaveTextContent('Efeito de arma resistido');
  });

  it('sem disparo, não fala em efeito de arma', () => {
    render(<AttackLog attacks={[attack()]} />);
    expect(screen.getByRole('listitem')).not.toHaveTextContent('Efeito de arma');
  });
});

const use = (over: Partial<CombatAbilityUse> = {}): CombatAbilityUse => ({
  id: 'u1',
  combat_id: 'c1',
  user_participant_id: 'p1',
  user_name: 'Eliabe',
  ability_id: 'tribe-levi-16-palavra-de-auto',
  ability_name: 'Palavra de Autoridade',
  action_type: 'action',
  status: 'applied',
  cd: null,
  save_attribute: null,
  test_id: null,
  targets: [
    {
      participantId: 'p2',
      name: 'Filisteu',
      conditions: [{ conditionId: 'paralisado', duration: 1 }],
    },
  ],
  created_at: '2026-10-27T10:05:00Z',
  ...over,
});

describe('AttackLog: usos de Habilidade', () => {
  it('só com usos, a lista aparece', () => {
    render(<AttackLog attacks={[]} abilityUses={[use()]} />);
    expect(screen.getByRole('listitem')).toHaveTextContent(
      'Eliabe usou Palavra de Autoridade · Filisteu: Paralisado',
    );
  });

  it('o alvo que resistiu aparece como resistiu', () => {
    render(
      <AttackLog
        attacks={[]}
        abilityUses={[
          use({ targets: [{ participantId: 'p2', name: 'Filisteu', conditions: [] }] }),
        ]}
      />,
    );
    expect(screen.getByRole('listitem')).toHaveTextContent('Filisteu: resistiu');
  });

  it('um uso que tira Condição diz o que saiu de cada aliado', () => {
    render(
      <AttackLog
        attacks={[]}
        abilityUses={[
          use({
            ability_name: 'Purificação',
            targets: [
              { participantId: 'p3', name: 'Bob', conditions: [], removed: ['envenenado'] },
              { participantId: 'p4', name: 'Rute', conditions: [], removed: [] },
            ],
          }),
        ]}
      />,
    );
    expect(screen.getByRole('listitem')).toHaveTextContent(
      'Eliabe usou Purificação · Bob: tirou Envenenado · Rute: não tinha o que tirar',
    );
    expect(screen.getByRole('listitem')).not.toHaveTextContent('resistiu');
  });

  it('um uso com TR pendente diz o TR e a CD que o Mestre vai lançar', () => {
    render(
      <AttackLog
        attacks={[]}
        abilityUses={[
          use({
            status: 'pending',
            cd: 13,
            save_attribute: 'sab',
            targets: [{ participantId: 'p2', name: 'Filisteu', conditions: [] }],
          }),
        ]}
      />,
    );
    expect(screen.getByRole('listitem')).toHaveTextContent(
      'aguardando o TR de Sabedoria (CD 13) · Filisteu',
    );
  });

  it('um uso com TR resolvido mostra o dado, o total e o resultado de cada alvo', () => {
    render(
      <AttackLog
        attacks={[]}
        abilityUses={[
          use({
            status: 'resolved',
            cd: 13,
            save_attribute: 'sab',
            targets: [
              {
                participantId: 'p2',
                name: 'Filisteu',
                conditions: [{ conditionId: 'amedrontado', duration: 10 }],
                natural: 4,
                total: 9,
                failed: true,
              },
              {
                participantId: 'p3',
                name: 'Bandido',
                conditions: [],
                natural: 15,
                total: 19,
                failed: false,
              },
            ],
          }),
        ]}
      />,
    );
    const row = screen.getByRole('listitem');
    expect(row).toHaveTextContent('Filisteu: d20 4 (9 contra CD 13) · Amedrontado');
    expect(row).toHaveTextContent('Bandido: d20 15 (19 contra CD 13) · passou');
  });

  it('um uso que expirou sem o TR diz que não teve efeito', () => {
    render(<AttackLog attacks={[]} abilityUses={[use({ status: 'expired', cd: 13 })]} />);
    expect(screen.getByRole('listitem')).toHaveTextContent('expirou sem efeito');
  });

  it('ataques e usos ficam juntos, do mais novo para o mais antigo', () => {
    render(
      <AttackLog
        attacks={[attack({ id: 'a1', created_at: '2026-10-27T10:00:00Z' })]}
        abilityUses={[use({ created_at: '2026-10-27T10:05:00Z' })]}
      />,
    );
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Palavra de Autoridade');
    expect(rows[1]).toHaveTextContent('Eliabe → Filisteu');
  });

  it('o título diz ataques e Habilidades quando há usos', () => {
    render(<AttackLog attacks={[attack()]} abilityUses={[use()]} />);
    expect(screen.getByRole('heading', { name: 'Últimos ataques e Habilidades' })).toBeVisible();
  });

  it('sem usos, o título continua "Últimos ataques"', () => {
    render(<AttackLog attacks={[attack()]} abilityUses={[]} />);
    expect(screen.getByRole('heading', { name: 'Últimos ataques' })).toBeVisible();
  });
});
