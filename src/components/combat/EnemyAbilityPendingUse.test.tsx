import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { CombatAbilityUse } from '@/data-access/combat';
import type { SessionTestResult } from '@/data-access/sessionTests';

const h = vi.hoisted(() => ({
  results: [] as SessionTestResult[],
  resolveEnemyAbilityUse: vi.fn(),
}));
vi.mock('@/hooks/useTestResults', () => ({ useTestResults: () => h.results }));
vi.mock('@/services/enemyAbilityService', () => ({
  resolveEnemyAbilityUse: h.resolveEnemyAbilityUse,
}));
vi.mock('@/lib/systemRng', async () => ({
  systemRng: (await import('@/domain/rng')).createSeededRng(11),
}));

import { EnemyAbilityPendingUse } from './EnemyAbilityPendingUse';

beforeEach(() => {
  h.results = [];
  h.resolveEnemyAbilityUse.mockReset().mockResolvedValue({ status: 'resolved', results: [] });
});
afterEach(cleanup);

const pendingRow = (over: Partial<CombatAbilityUse> = {}): CombatAbilityUse => ({
  id: 'u1',
  combat_id: 'cb1',
  user_participant_id: 'p-anakim',
  user_name: 'Anakim',
  ability_id: 'enemy-presenca-aterradora',
  ability_name: 'Presença Aterradora',
  action_type: 'action',
  status: 'pending',
  cd: 13,
  save_attribute: 'sab',
  test_id: 'test-1',
  enemy_effect: null,
  targets: [
    { participantId: 'p-eliabe', name: 'Eliabe', conditions: [] },
    { participantId: 'p-rute', name: 'Rute', conditions: [] },
  ],
  created_at: '2026-10-27T10:05:00Z',
  ...over,
});
const participants = [
  { id: 'p-eliabe', entity_id: 'c-eliabe', entity_type: 'player' as const },
  { id: 'p-rute', entity_id: 'c-rute', entity_type: 'player' as const },
  { id: 'p-npc', entity_id: 'c-npc', entity_type: 'npc' as const },
];
const result = (over: Partial<SessionTestResult>): SessionTestResult =>
  ({
    id: 'r1',
    test_id: 'test-1',
    character_id: 'c-eliabe',
    player_id: 'u1',
    status: 'pending',
    master_mark: null,
    applied_mode: null,
    result_value: null,
    roll_value: null,
    is_approved: null,
    ...over,
  }) as SessionTestResult;

describe('EnemyAbilityPendingUse', () => {
  it('mostra a Habilidade, o TR e a CD, e quem já respondeu ou ainda espera', () => {
    h.results = [
      result({ status: 'submitted', is_approved: false, result_value: 9, roll_value: 6 }),
      result({ id: 'r2', character_id: 'c-rute' }),
    ];
    render(<EnemyAbilityPendingUse use={pendingRow()} participants={participants} />);
    expect(screen.getByRole('heading', { name: 'Presença Aterradora' })).toBeInTheDocument();
    expect(screen.getByText(/TR de Sabedoria · CD 13/)).toBeInTheDocument();
    expect(screen.getByText(/Eliabe: falhou \(9 contra CD 13\)/)).toBeInTheDocument();
    expect(screen.getByText('Rute: aguardando o jogador')).toBeInTheDocument();
  });

  it('um jogador que passou aparece como passou', () => {
    h.results = [result({ status: 'submitted', is_approved: true, result_value: 15 })];
    render(<EnemyAbilityPendingUse use={pendingRow()} participants={participants} />);
    expect(screen.getByText(/Eliabe: passou \(15 contra CD 13\)/)).toBeInTheDocument();
  });

  it('avisa que quem não responder fica sem efeito', () => {
    render(<EnemyAbilityPendingUse use={pendingRow()} participants={participants} />);
    expect(screen.getByText(/Quem não responder fica sem efeito/)).toBeInTheDocument();
  });

  it('aplica os resultados sem pedir dado de jogador', async () => {
    render(<EnemyAbilityPendingUse use={pendingRow()} participants={participants} />);
    expect(screen.queryByLabelText(/d20 de/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar resultados' }));
    await waitFor(() => expect(h.resolveEnemyAbilityUse).toHaveBeenCalled());
    expect(h.resolveEnemyAbilityUse.mock.calls[0][0]).toMatchObject({
      use: { id: 'u1' },
      npcRolls: [],
    });
  });

  describe('NPC jogável', () => {
    const withNpc = () =>
      pendingRow({
        targets: [
          { participantId: 'p-eliabe', name: 'Eliabe', conditions: [] },
          { participantId: 'p-npc', name: 'Jonas', conditions: [] },
        ],
      });

    it('o Mestre digita o d20 dele e só aplica com o dado válido', async () => {
      render(<EnemyAbilityPendingUse use={withNpc()} participants={participants} />);
      expect(screen.queryByLabelText('d20 de Eliabe')).not.toBeInTheDocument();
      const apply = screen.getByRole('button', { name: 'Aplicar resultados' });
      expect(apply).toBeDisabled();
      fireEvent.change(screen.getByLabelText('d20 de Jonas'), { target: { value: '12' } });
      expect(apply).toBeEnabled();
      fireEvent.click(apply);
      await waitFor(() => expect(h.resolveEnemyAbilityUse).toHaveBeenCalled());
      expect(h.resolveEnemyAbilityUse.mock.calls[0][0].npcRolls).toEqual([
        { participantId: 'p-npc', natural: 12, mark: null },
      ]);
    });

    it('a Rolagem Virtual preenche o dado do NPC jogável', () => {
      render(<EnemyAbilityPendingUse use={withNpc()} participants={participants} />);
      fireEvent.click(screen.getByRole('button', { name: 'Rolagem Virtual de Jonas' }));
      const value = Number((screen.getByLabelText('d20 de Jonas') as HTMLInputElement).value);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(20);
    });

    it('recusa um d20 fora de 1 a 20', () => {
      render(<EnemyAbilityPendingUse use={withNpc()} participants={participants} />);
      fireEvent.change(screen.getByLabelText('d20 de Jonas'), { target: { value: '21' } });
      expect(screen.getByRole('button', { name: 'Aplicar resultados' })).toBeDisabled();
    });
  });

  it('mostra o erro do serviço e libera o botão', async () => {
    h.resolveEnemyAbilityUse.mockRejectedValue(new Error('falhou ao gravar'));
    render(<EnemyAbilityPendingUse use={pendingRow()} participants={participants} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar resultados' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('falhou ao gravar');
    expect(screen.getByRole('button', { name: 'Aplicar resultados' })).toBeEnabled();
  });
});

describe('EnemyAbilityPendingUse: Fé perdida', () => {
  const grito = () => pendingRow({ ability_id: 'enemy-grito-atormentador', cd: 12 });
  const faithInput = (name: string) => screen.queryByLabelText(`Dado de Fé de ${name} (1d4)`);

  it('pede o dado de Fé só de quem falhou; quem passou ou ainda não respondeu não pede', () => {
    h.results = [
      result({ status: 'submitted', is_approved: false, result_value: 9, roll_value: 6 }),
      result({ id: 'r2', character_id: 'c-rute', status: 'submitted', is_approved: true }),
    ];
    render(<EnemyAbilityPendingUse use={grito()} participants={participants} />);
    expect(faithInput('Eliabe')).toBeInTheDocument();
    expect(faithInput('Rute')).not.toBeInTheDocument();
  });

  it('aplicar fica desabilitado até o dado de Fé de quem falhou valer de 1 a 4', () => {
    h.results = [
      result({ status: 'submitted', is_approved: false, result_value: 9, roll_value: 6 }),
    ];
    render(<EnemyAbilityPendingUse use={grito()} participants={participants} />);
    const apply = screen.getByRole('button', { name: 'Aplicar resultados' });
    expect(apply).toBeDisabled();
    for (const bad of ['0', '5', '2.5']) {
      fireEvent.change(faithInput('Eliabe')!, { target: { value: bad } });
      expect(apply).toBeDisabled();
    }
    fireEvent.change(faithInput('Eliabe')!, { target: { value: '4' } });
    expect(apply).toBeEnabled();
  });

  it('manda o dado de Fé de quem falhou ao serviço', async () => {
    h.results = [
      result({ status: 'submitted', is_approved: false, result_value: 9, roll_value: 6 }),
    ];
    render(<EnemyAbilityPendingUse use={grito()} participants={participants} />);
    fireEvent.change(faithInput('Eliabe')!, { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar resultados' }));
    await waitFor(() => expect(h.resolveEnemyAbilityUse).toHaveBeenCalled());
    expect(h.resolveEnemyAbilityUse.mock.calls[0][0].faithRolls).toEqual([
      { participantId: 'p-eliabe', value: 3 },
    ]);
  });

  it('a Rolagem Virtual de Fé usa as faces do efeito', () => {
    h.results = [
      result({ status: 'submitted', is_approved: false, result_value: 9, roll_value: 6 }),
    ];
    render(<EnemyAbilityPendingUse use={grito()} participants={participants} />);
    fireEvent.click(screen.getByRole('button', { name: 'Rolagem Virtual de Fé de Eliabe' }));
    const value = Number((faithInput('Eliabe') as HTMLInputElement).value);
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(4);
  });

  it('o NPC jogável mostra o dado de Fé sempre, para o caso de falhar', () => {
    const use = grito();
    use.targets = [{ participantId: 'p-npc', name: 'Jonas', conditions: [] }];
    render(<EnemyAbilityPendingUse use={use} participants={participants} />);
    expect(screen.getByLabelText('Dado de Fé de Jonas (1d4)')).toBeInTheDocument();
  });

  it('mostra o lembrete da Habilidade', () => {
    render(<EnemyAbilityPendingUse use={grito()} participants={participants} />);
    expect(
      screen.getByText(/Desvantagem na próxima jogada de ataque de quem falhou\./),
    ).toBeInTheDocument();
  });

  it('uma Habilidade sem perda de Fé não pede dado de Fé nem manda faithRolls', async () => {
    h.results = [
      result({ status: 'submitted', is_approved: false, result_value: 9, roll_value: 6 }),
    ];
    render(<EnemyAbilityPendingUse use={pendingRow()} participants={participants} />);
    expect(faithInput('Eliabe')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar resultados' }));
    await waitFor(() => expect(h.resolveEnemyAbilityUse).toHaveBeenCalled());
    expect(h.resolveEnemyAbilityUse.mock.calls[0][0].faithRolls).toEqual([]);
  });

  it('a Maldição de Baal usa 1d6', () => {
    h.results = [
      result({ status: 'submitted', is_approved: false, result_value: 9, roll_value: 6 }),
    ];
    render(
      <EnemyAbilityPendingUse
        use={pendingRow({ ability_id: 'enemy-maldicao-de-baal', cd: 13 })}
        participants={participants}
      />,
    );
    fireEvent.change(screen.getByLabelText('Dado de Fé de Eliabe (1d6)'), {
      target: { value: '6' },
    });
    expect(screen.getByRole('button', { name: 'Aplicar resultados' })).toBeEnabled();
  });
});
