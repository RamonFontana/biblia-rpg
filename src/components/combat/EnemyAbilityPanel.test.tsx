import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  getCharactersSkills: vi.fn(),
  fireEnemyAbility: vi.fn(),
}));
vi.mock('@/data-access/characters', () => ({ getCharactersSkills: h.getCharactersSkills }));
vi.mock('@/services/enemyAbilityService', () => ({ fireEnemyAbility: h.fireEnemyAbility }));

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
