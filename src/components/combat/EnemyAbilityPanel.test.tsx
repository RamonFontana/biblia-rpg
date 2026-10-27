import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  getCharactersSkills: vi.fn(),
  fireEnemyAbility: vi.fn(),
  rechargeEnemyAbility: vi.fn(),
}));
vi.mock('@/data-access/characters', () => ({ getCharactersSkills: h.getCharactersSkills }));
vi.mock('@/services/enemyAbilityService', () => ({
  fireEnemyAbility: h.fireEnemyAbility,
  rechargeEnemyAbility: h.rechargeEnemyAbility,
}));
vi.mock('@/lib/systemRng', async () => ({
  systemRng: (await import('@/domain/rng')).createSeededRng(3),
}));

import { EnemyAbilityPanel } from './EnemyAbilityPanel';

const enemies = [{ participantId: 'p-anakim', entityId: 'c-anakim', name: 'Anakim' }];
const characters = [
  { participantId: 'p-eliabe', entityId: 'c-eliabe', entityType: 'player', name: 'Eliabe' },
  { participantId: 'p-rute', entityId: 'c-rute', entityType: 'player', name: 'Rute' },
  { participantId: 'p-npc', entityId: 'c-npc', entityType: 'npc', name: 'Jonas' },
];
const setup = () =>
  render(<EnemyAbilityPanel sessionId="s1" enemies={enemies} characters={characters} />);

beforeEach(() => {
  h.fireEnemyAbility.mockReset().mockResolvedValue({ id: 'u1', testId: 't1', applied: [] });
  h.getCharactersSkills.mockReset().mockResolvedValue({
    'c-anakim': {
      name: 'Anakim',
      skills: [
        { name: 'Presença Aterradora', description: 'd', libraryId: 'enemy-presenca-aterradora' },
        { name: 'Comando', description: 'Só texto' },
      ],
    },
  });
});
afterEach(cleanup);

describe('EnemyAbilityPanel', () => {
  it('lista as Habilidades com efeito de cada inimigo e ignora as que são só texto', async () => {
    setup();
    expect(await screen.findByText('Presença Aterradora')).toBeInTheDocument();
    expect(
      screen.getByText('TR de Sabedoria CD 13 · Amedrontado (10 rodadas)'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Comando')).not.toBeInTheDocument();
  });

  it('não desenha nada sem Habilidade com efeito', async () => {
    h.getCharactersSkills.mockResolvedValue({
      'c-anakim': { name: 'Anakim', skills: [{ name: 'Comando', description: 'texto' }] },
    });
    const { container } = setup();
    await waitFor(() => expect(h.getCharactersSkills).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('um inimigo com a lista de Habilidades de jogador (não é lista) é ignorado', async () => {
    h.getCharactersSkills.mockResolvedValue({
      'c-anakim': { name: 'Anakim', skills: { ability_uses: {} } },
    });
    const { container } = setup();
    await waitFor(() => expect(h.getCharactersSkills).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('dispara contra os alvos marcados, com a marca de cada jogador', async () => {
    setup();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Usar Presença Aterradora (Anakim)' }),
    );
    fireEvent.click(screen.getByLabelText('Eliabe'));
    fireEvent.click(screen.getByLabelText('Rute'));
    fireEvent.change(screen.getByLabelText('Modalidade de Rute'), {
      target: { value: 'desvantagem' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Usar a Habilidade' }));
    await waitFor(() => expect(h.fireEnemyAbility).toHaveBeenCalled());
    const input = h.fireEnemyAbility.mock.calls[0][0];
    expect(input).toMatchObject({
      sessionId: 's1',
      enemyParticipantId: 'p-anakim',
      ability: { id: 'enemy-presenca-aterradora' },
    });
    expect(input.targets).toEqual([
      expect.objectContaining({ participantId: 'p-eliabe', entityType: 'player', mark: null }),
      expect.objectContaining({ participantId: 'p-rute', mark: 'desvantagem' }),
    ]);
  });

  it('o NPC jogável não tem modalidade: o Mestre rola o TR dele depois', async () => {
    setup();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Usar Presença Aterradora (Anakim)' }),
    );
    fireEvent.click(screen.getByLabelText('Jonas'));
    expect(screen.queryByLabelText('Modalidade de Jonas')).not.toBeInTheDocument();
    expect(screen.getByText(/você rola o TR de Jonas/)).toBeInTheDocument();
  });

  it('só dispara com ao menos um alvo marcado', async () => {
    setup();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Usar Presença Aterradora (Anakim)' }),
    );
    expect(screen.getByRole('button', { name: 'Usar a Habilidade' })).toBeDisabled();
    fireEvent.click(screen.getByLabelText('Eliabe'));
    expect(screen.getByRole('button', { name: 'Usar a Habilidade' })).toBeEnabled();
  });

  it('depois de disparar, fecha o painel e avisa que o TR foi para os celulares', async () => {
    setup();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Usar Presença Aterradora (Anakim)' }),
    );
    fireEvent.click(screen.getByLabelText('Eliabe'));
    fireEvent.click(screen.getByRole('button', { name: 'Usar a Habilidade' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Presença Aterradora');
    expect(screen.queryByRole('button', { name: 'Usar a Habilidade' })).not.toBeInTheDocument();
  });

  it('mostra o erro do serviço (um Teste ativo, por exemplo) e mantém o painel', async () => {
    h.fireEnemyAbility.mockRejectedValue(
      new Error('Conclua o Teste ativo antes de usar a Habilidade'),
    );
    setup();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Usar Presença Aterradora (Anakim)' }),
    );
    fireEvent.click(screen.getByLabelText('Eliabe'));
    fireEvent.click(screen.getByRole('button', { name: 'Usar a Habilidade' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Conclua o Teste ativo');
    expect(screen.getByRole('button', { name: 'Usar a Habilidade' })).toBeEnabled();
  });

  it('cancelar fecha o painel sem disparar', async () => {
    setup();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Usar Presença Aterradora (Anakim)' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('button', { name: 'Usar a Habilidade' })).not.toBeInTheDocument();
    expect(h.fireEnemyAbility).not.toHaveBeenCalled();
  });

  it('uma Habilidade sem TR não pede modalidade e avisa que foi aplicada', async () => {
    h.getCharactersSkills.mockResolvedValue({
      'c-anakim': {
        name: 'Anakim',
        skills: [
          {
            name: 'Laço',
            description: '',
            effect: { apply: [{ conditionId: 'agarrado', rounds: 3 }], usage: 'unlimited' },
          },
        ],
      },
    });
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Usar Laço (Anakim)' }));
    fireEvent.click(screen.getByLabelText('Eliabe'));
    fireEvent.click(screen.getByLabelText('Jonas'));
    expect(screen.queryByLabelText('Modalidade de Eliabe')).not.toBeInTheDocument();
    expect(screen.queryByText(/você rola o TR/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Usar a Habilidade' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Laço: aplicada.');
  });
});

describe('EnemyAbilityPanel: uso por combate e Recarga', () => {
  const GRITO = 'enemy-grito-atormentador';
  const withGrito = () =>
    h.getCharactersSkills.mockResolvedValue({
      'c-anakim': {
        name: 'Anakim',
        skills: [{ name: 'Grito Atormentador', description: '', libraryId: GRITO }],
      },
    });
  const render_ = (
    abilityState: Record<string, 'used' | 'recharging'>,
    currentTurnParticipantId?: string,
  ) =>
    render(
      <EnemyAbilityPanel
        sessionId="s1"
        enemies={[{ ...enemies[0], abilityState }]}
        characters={characters}
        currentTurnParticipantId={currentTurnParticipantId}
      />,
    );

  beforeEach(() => {
    withGrito();
    h.rechargeEnemyAbility.mockReset().mockResolvedValue(true);
  });

  it('em Recarga, o botão Usar fica desabilitado e o motivo aparece', async () => {
    render_({ [GRITO]: 'recharging' });
    expect(
      await screen.findByRole('button', { name: 'Usar Grito Atormentador (Anakim)' }),
    ).toBeDisabled();
    expect(screen.getByText('Em Recarga (5-6)')).toBeInTheDocument();
  });

  it('usada neste combate, o botão Usar fica desabilitado e o motivo aparece', async () => {
    h.getCharactersSkills.mockResolvedValue({
      'c-anakim': {
        name: 'Anakim',
        skills: [
          {
            name: 'Laço',
            description: '',
            effect: { apply: [{ conditionId: 'agarrado' }], usage: 'per_combat' },
          },
        ],
      },
    });
    render_({ 'enemy-custom:Laço': 'used' });
    expect(await screen.findByRole('button', { name: 'Usar Laço (Anakim)' })).toBeDisabled();
    expect(screen.getByText('Já usada neste combate')).toBeInTheDocument();
  });

  it('pronta, o botão Usar fica habilitado e o estado vai ao disparo', async () => {
    render_({ outra: 'used' });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Usar Grito Atormentador (Anakim)' }),
    );
    fireEvent.click(screen.getByLabelText('Eliabe'));
    fireEvent.click(screen.getByRole('button', { name: 'Usar a Habilidade' }));
    await waitFor(() => expect(h.fireEnemyAbility).toHaveBeenCalled());
    expect(h.fireEnemyAbility.mock.calls[0][0].abilityState).toEqual({ outra: 'used' });
  });

  it('no turno do inimigo, a Recarga em andamento pede o d6', async () => {
    render_({ [GRITO]: 'recharging' }, 'p-anakim');
    expect(await screen.findByText('Recarga (5-6): início do turno de Anakim')).toBeInTheDocument();
    expect(
      screen.getByLabelText('d6 da Recarga de Grito Atormentador (Anakim)'),
    ).toBeInTheDocument();
  });

  it('fora do turno do inimigo não há controle de Recarga', async () => {
    render_({ [GRITO]: 'recharging' }, 'p-eliabe');
    await screen.findByText('Em Recarga (5-6)');
    expect(screen.queryByText(/início do turno de Anakim/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/d6 da Recarga/)).not.toBeInTheDocument();
  });

  it('o d6 com 5 ou 6 recarrega e avisa que a Habilidade voltou', async () => {
    render_({ [GRITO]: 'recharging' }, 'p-anakim');
    fireEvent.change(await screen.findByLabelText('d6 da Recarga de Grito Atormentador (Anakim)'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Recarregar Grito Atormentador (Anakim)' }));
    await waitFor(() => expect(h.rechargeEnemyAbility).toHaveBeenCalled());
    expect(h.rechargeEnemyAbility.mock.calls[0][0]).toEqual({
      participantId: 'p-anakim',
      abilityKey: GRITO,
      abilityState: { [GRITO]: 'recharging' },
      d6: 5,
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Grito Atormentador voltou');
  });

  it('o d6 com 4 mantém a Recarga e diz que continua em recarga', async () => {
    h.rechargeEnemyAbility.mockResolvedValue(false);
    render_({ [GRITO]: 'recharging' }, 'p-anakim');
    fireEvent.change(await screen.findByLabelText('d6 da Recarga de Grito Atormentador (Anakim)'), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Recarregar Grito Atormentador (Anakim)' }));
    expect(await screen.findByRole('status')).toHaveTextContent('continua em Recarga');
  });

  it('só recarrega com um d6 de 1 a 6', async () => {
    render_({ [GRITO]: 'recharging' }, 'p-anakim');
    const input = await screen.findByLabelText('d6 da Recarga de Grito Atormentador (Anakim)');
    const button = screen.getByRole('button', { name: 'Recarregar Grito Atormentador (Anakim)' });
    expect(button).toBeDisabled();
    for (const bad of ['0', '7', '2.5']) {
      fireEvent.change(input, { target: { value: bad } });
      expect(button).toBeDisabled();
    }
    fireEvent.change(input, { target: { value: '6' } });
    expect(button).toBeEnabled();
  });

  it('a Rolagem Virtual preenche o d6 da Recarga', async () => {
    render_({ [GRITO]: 'recharging' }, 'p-anakim');
    fireEvent.click(
      await screen.findByRole('button', { name: 'Rolagem Virtual da Recarga (Anakim)' }),
    );
    const value = Number(
      (screen.getByLabelText('d6 da Recarga de Grito Atormentador (Anakim)') as HTMLInputElement)
        .value,
    );
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(6);
  });

  it('mostra o erro do serviço ao recarregar', async () => {
    h.rechargeEnemyAbility.mockRejectedValue(new Error('falhou ao gravar'));
    render_({ [GRITO]: 'recharging' }, 'p-anakim');
    fireEvent.change(await screen.findByLabelText('d6 da Recarga de Grito Atormentador (Anakim)'), {
      target: { value: '6' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Recarregar Grito Atormentador (Anakim)' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('falhou ao gravar');
  });
});
