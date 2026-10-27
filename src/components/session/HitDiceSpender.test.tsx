// Gastar Dados de Vida no Descanso Curto aberto: o que a linha do personagem mostra e grava.
// Termos: CONTEXT.md (Dado de Vida, Descanso Curto, Morrendo, Estável). Regras: regras-base.md 6.4.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const data = vi.hoisted(() => ({ spendHitDie: vi.fn() }));
vi.mock('@/data-access/characters', () => data);
vi.mock('@/lib/systemRng', () => ({ systemRng: () => 0.99 }));

import { HitDiceSpender, type SpenderCharacter } from './HitDiceSpender';

const hero = (over: Partial<SpenderCharacter> = {}): SpenderCharacter => ({
  id: 'c1',
  name: 'Eliabe',
  tribe: 'Judá',
  vocation: 'Guerreiro',
  level: 3,
  hit_dice_spent: 0,
  attributes: { for: 10, des: 10, con: 14, int: 10, sab: 10, car: 10 },
  stats: { pv: 30, current_pv: 10, ca: 12, faith: 50, current_faith: 50 },
  skills: {},
  ...over,
});

const renderSpender = (character: SpenderCharacter, restOpen = true) => {
  const onSpent = vi.fn();
  render(<HitDiceSpender character={character} restOpen={restOpen} onSpent={onSpent} />);
  return onSpent;
};

const typeDie = (value: string) =>
  fireEvent.change(screen.getByLabelText(/Resultado do d10/), { target: { value } });

beforeEach(() => {
  data.spendHitDie.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(cleanup);

describe('HitDiceSpender: o que mostra', () => {
  it('mostra a reserva e o dado da Vocação', () => {
    renderSpender(hero({ hit_dice_spent: 1 }));
    expect(screen.getByText('Dados de Vida 2/3 (d10)')).toBeInTheDocument();
    expect(screen.getByLabelText(/Resultado do d10/)).toBeInTheDocument();
  });

  it('Batedor usa d8', () => {
    renderSpender(hero({ vocation: 'Batedor' }));
    expect(screen.getByLabelText(/Resultado do d8/)).toBeInTheDocument();
  });
});

describe('HitDiceSpender: gastar o dado físico', () => {
  it('cura o rolado mais o modificador de CON e grava PV e gasto juntos', async () => {
    const onSpent = renderSpender(hero());
    typeDie('6');
    fireEvent.click(screen.getByRole('button', { name: 'Gastar dado' }));
    await waitFor(() =>
      expect(data.spendHitDie).toHaveBeenCalledWith('c1', {
        stats: expect.objectContaining({ current_pv: 18 }),
        hitDiceSpent: 1,
        wakeUp: false,
      }),
    );
    expect(onSpent).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        hit_dice_spent: 1,
        stats: expect.objectContaining({ current_pv: 18 }),
      }),
    );
    expect(await screen.findByText(/Curou 8 PV/)).toBeInTheDocument();
  });

  it('não passa do PV máximo', async () => {
    renderSpender(hero({ stats: { pv: 30, current_pv: 27, ca: 12, faith: 5, current_faith: 5 } }));
    typeDie('10');
    fireEvent.click(screen.getByRole('button', { name: 'Gastar dado' }));
    await waitFor(() =>
      expect(data.spendHitDie).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ stats: expect.objectContaining({ current_pv: 30 }) }),
      ),
    );
    expect(await screen.findByText(/Curou 3 PV/)).toBeInTheDocument();
  });

  it('recusa dado fora do d10 sem gravar', async () => {
    renderSpender(hero());
    typeDie('11');
    fireEvent.click(screen.getByRole('button', { name: 'Gastar dado' }));
    expect(await screen.findByText(/de 1 a 10/)).toBeInTheDocument();
    expect(data.spendHitDie).not.toHaveBeenCalled();
  });

  it('sem número digitado, o botão Gastar dado fica desabilitado', () => {
    renderSpender(hero());
    expect(screen.getByRole('button', { name: 'Gastar dado' })).toBeDisabled();
  });

  it('mostra erro quando a gravação falha e não avisa a tela', async () => {
    data.spendHitDie.mockRejectedValueOnce(new Error('falhou'));
    const onSpent = renderSpender(hero());
    typeDie('4');
    fireEvent.click(screen.getByRole('button', { name: 'Gastar dado' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Não foi possível/);
    expect(onSpent).not.toHaveBeenCalled();
  });
});

describe('HitDiceSpender: Rolagem Virtual', () => {
  it('rola o dado da Vocação e gasta (rng 0.99 => 10)', async () => {
    renderSpender(hero());
    fireEvent.click(screen.getByRole('button', { name: 'Rolar dado virtual' }));
    await waitFor(() =>
      expect(data.spendHitDie).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ stats: expect.objectContaining({ current_pv: 22 }) }),
      ),
    );
    expect(await screen.findByText(/Rolou 10/)).toBeInTheDocument();
  });
});

describe('HitDiceSpender: quando não pode gastar', () => {
  const disabled = () => {
    expect(screen.getByRole('button', { name: 'Gastar dado' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rolar dado virtual' })).toBeDisabled();
  };

  it('descanso fechado: desabilitado, com o motivo', () => {
    renderSpender(hero(), false);
    disabled();
    expect(screen.getByText('O Descanso Curto não está aberto.')).toBeInTheDocument();
  });

  it('PV cheio', () => {
    renderSpender(hero({ stats: { pv: 30, current_pv: 30, ca: 12, faith: 5, current_faith: 5 } }));
    disabled();
    expect(screen.getByText('PV já está no máximo.')).toBeInTheDocument();
  });

  it('sem dados restantes', () => {
    renderSpender(hero({ hit_dice_spent: 3 }));
    disabled();
    expect(screen.getByText('Sem Dados de Vida restantes.')).toBeInTheDocument();
  });

  it('Morrendo (0 PV, não Estável)', () => {
    renderSpender(hero({ stats: { pv: 30, current_pv: 0, ca: 12, faith: 5, current_faith: 5 } }));
    disabled();
    expect(screen.getByText(/Morrendo/)).toBeInTheDocument();
  });

  it('Morto', () => {
    renderSpender(hero({ is_dead: true }));
    disabled();
    expect(screen.getByText('Personagem morto.')).toBeInTheDocument();
  });
});

describe('HitDiceSpender: Estável acorda', () => {
  it('gasta, sobe o PV e limpa o Estável e os Testes de Morte', async () => {
    const onSpent = renderSpender(
      hero({
        is_stable: true,
        stats: { pv: 30, current_pv: 0, ca: 12, faith: 5, current_faith: 5 },
      }),
    );
    typeDie('5');
    fireEvent.click(screen.getByRole('button', { name: 'Gastar dado' }));
    await waitFor(() =>
      expect(data.spendHitDie).toHaveBeenCalledWith('c1', {
        stats: expect.objectContaining({ current_pv: 7 }),
        hitDiceSpent: 1,
        wakeUp: true,
      }),
    );
    expect(onSpent).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        is_stable: false,
        death_saves_successes: 0,
        death_saves_failures: 0,
      }),
    );
  });
});

describe('HitDiceSpender: Sangue Resiliente (Manassés, caminho B do nível 4)', () => {
  const manasses = (path: 'A' | 'B') =>
    hero({
      tribe: 'Manassés',
      level: 4,
      skills: { path_choices: { tribe: { 4: path } } },
    });

  it('com o caminho B soma 1 PV por dado', async () => {
    renderSpender(manasses('B'));
    typeDie('6');
    fireEvent.click(screen.getByRole('button', { name: 'Gastar dado' }));
    await waitFor(() =>
      expect(data.spendHitDie).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ stats: expect.objectContaining({ current_pv: 19 }) }),
      ),
    );
  });

  it('com o caminho A não soma', async () => {
    renderSpender(manasses('A'));
    typeDie('6');
    fireEvent.click(screen.getByRole('button', { name: 'Gastar dado' }));
    await waitFor(() =>
      expect(data.spendHitDie).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ stats: expect.objectContaining({ current_pv: 18 }) }),
      ),
    );
  });
});
