// O painel do Mestre com os usos de Habilidade que esperam o TR: o Mestre digita o d20 de cada alvo
// (ou usa a Rolagem Virtual), marca Vantagem ou Desvantagem e resolve. Termos: CONTEXT.md (TR,
// CD da Habilidade, Vantagem, Desvantagem, Rolagem Virtual).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { CombatAbilityUse } from '@/data-access/combat';

const h = vi.hoisted(() => ({ resolveAbilityUseRolls: vi.fn() }));
vi.mock('@/services/abilityService', () => ({ resolveAbilityUseRolls: h.resolveAbilityUseRolls }));
vi.mock('@/lib/systemRng', async () => ({
  systemRng: (await import('@/domain/rng')).createSeededRng(11),
}));

import { AbilityPendingPanel } from './AbilityPendingPanel';

afterEach(cleanup);

const usageRow = (over: Partial<CombatAbilityUse> = {}): CombatAbilityUse => ({
  id: 'u1',
  combat_id: 'c1',
  user_participant_id: 'p1',
  user_name: 'Eliabe',
  ability_id: 'tribe-manasses-12-tatica-do-canta',
  ability_name: 'Tática do Cântaro Quebrado',
  action_type: 'bonus_action',
  status: 'pending',
  cd: 13,
  save_attribute: 'sab',
  test_id: null,
  targets: [
    { participantId: 'p2', name: 'Filisteu', conditions: [] },
    { participantId: 'p3', name: 'Bandido', conditions: [] },
  ],
  created_at: '2026-10-27T10:05:00Z',
  ...over,
});
const participants = [
  { id: 'p2', entity_id: 'e1', entity_type: 'enemy' as const },
  { id: 'p3', entity_id: 'e2', entity_type: 'enemy' as const },
];

const setup = (uses: CombatAbilityUse[] = [usageRow()]) =>
  render(<AbilityPendingPanel uses={uses} participants={participants} />);
const typeRoll = (name: string, value: string) =>
  fireEvent.change(screen.getByLabelText(`d20 de ${name}`), { target: { value } });

beforeEach(() => {
  h.resolveAbilityUseRolls.mockReset();
  h.resolveAbilityUseRolls.mockResolvedValue({ status: 'resolved', results: [] });
});

describe('AbilityPendingPanel', () => {
  it('sem usos pendentes não mostra nada', () => {
    const { container } = setup([
      usageRow({ status: 'resolved' }),
      usageRow({ id: 'u2', status: 'expired' }),
    ]);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra quem usou, a Habilidade, o TR e a CD, e uma linha por alvo', () => {
    setup();
    expect(screen.getByRole('heading', { name: /Tática do Cântaro Quebrado/ })).toBeVisible();
    expect(screen.getByText(/Eliabe/)).toBeVisible();
    expect(screen.getByText(/TR de Sabedoria · CD 13/)).toBeVisible();
    expect(screen.getByLabelText('d20 de Filisteu')).toBeVisible();
    expect(screen.getByLabelText('d20 de Bandido')).toBeVisible();
  });

  it('só os usos pendentes entram', () => {
    setup([usageRow(), usageRow({ id: 'u2', ability_name: 'Outra', status: 'resolved' })]);
    expect(screen.queryByRole('heading', { name: /Outra/ })).toBeNull();
  });

  it('resolver fica desabilitado até todos os alvos terem o d20', () => {
    setup();
    const resolve = screen.getByRole('button', { name: 'Resolver TR' });
    expect(resolve).toBeDisabled();
    typeRoll('Filisteu', '12');
    expect(resolve).toBeDisabled();
    typeRoll('Bandido', '7');
    expect(resolve).toBeEnabled();
  });

  it.each([['21'], ['0'], ['-3'], ['1.5']])('um d20 de %s não conta', (value) => {
    setup();
    typeRoll('Bandido', '7');
    typeRoll('Filisteu', value);
    expect(screen.getByRole('button', { name: 'Resolver TR' })).toBeDisabled();
  });

  it.each([['1'], ['20']])('os extremos %s valem', (value) => {
    setup();
    typeRoll('Bandido', '7');
    typeRoll('Filisteu', value);
    expect(screen.getByRole('button', { name: 'Resolver TR' })).toBeEnabled();
  });

  it('resolver manda ao serviço o uso, os participantes e o d20 de cada alvo', async () => {
    setup();
    typeRoll('Filisteu', '12');
    typeRoll('Bandido', '7');
    fireEvent.click(screen.getByRole('button', { name: 'Resolver TR' }));
    await waitFor(() => expect(h.resolveAbilityUseRolls).toHaveBeenCalledTimes(1));
    expect(h.resolveAbilityUseRolls).toHaveBeenCalledWith({
      use: expect.objectContaining({ id: 'u1' }),
      participants,
      rolls: [
        { participantId: 'p2', natural: 12, mark: null },
        { participantId: 'p3', natural: 7, mark: null },
      ],
    });
  });

  it('a marca de Vantagem ou Desvantagem vai junto e o lembrete do dado físico aparece', async () => {
    setup();
    fireEvent.change(screen.getByLabelText('Modalidade de Filisteu'), {
      target: { value: 'vantagem' },
    });
    fireEvent.change(screen.getByLabelText('Modalidade de Bandido'), {
      target: { value: 'desvantagem' },
    });
    expect(screen.getByText('Role dois d20 e use o maior.')).toBeVisible();
    expect(screen.getByText('Role dois d20 e use o menor.')).toBeVisible();
    typeRoll('Filisteu', '15');
    typeRoll('Bandido', '4');
    fireEvent.click(screen.getByRole('button', { name: 'Resolver TR' }));
    await waitFor(() => expect(h.resolveAbilityUseRolls).toHaveBeenCalled());
    expect(h.resolveAbilityUseRolls.mock.calls[0][0].rolls).toEqual([
      { participantId: 'p2', natural: 15, mark: 'vantagem' },
      { participantId: 'p3', natural: 4, mark: 'desvantagem' },
    ]);
  });

  it('a Rolagem Virtual preenche o d20 do alvo com um valor de 1 a 20', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Rolagem Virtual de Filisteu' }));
    const value = Number((screen.getByLabelText('d20 de Filisteu') as HTMLInputElement).value);
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(20);
  });

  it('com Vantagem a Rolagem Virtual mostra os dois dados e fica com o maior', () => {
    setup();
    fireEvent.change(screen.getByLabelText('Modalidade de Filisteu'), {
      target: { value: 'vantagem' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Rolagem Virtual de Filisteu' }));
    const value = Number((screen.getByLabelText('d20 de Filisteu') as HTMLInputElement).value);
    const shown = screen.getByText(/Rolou \d+ e \d+/).textContent!;
    const dice = shown.match(/\d+/g)!.slice(0, 2).map(Number);
    expect(value).toBe(Math.max(...dice));
  });

  it('o erro do serviço aparece e o painel continua', async () => {
    h.resolveAbilityUseRolls.mockRejectedValue(new Error('Falta o dado de Filisteu'));
    setup();
    typeRoll('Filisteu', '12');
    typeRoll('Bandido', '7');
    fireEvent.click(screen.getByRole('button', { name: 'Resolver TR' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Falta o dado de Filisteu');
    expect(screen.getByRole('button', { name: 'Resolver TR' })).toBeEnabled();
  });

  it('enquanto resolve, o botão espera', async () => {
    let finish: (v: unknown) => void = () => {};
    h.resolveAbilityUseRolls.mockReturnValue(new Promise((r) => (finish = r)));
    setup();
    typeRoll('Filisteu', '12');
    typeRoll('Bandido', '7');
    fireEvent.click(screen.getByRole('button', { name: 'Resolver TR' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Resolver TR' })).toBeDisabled());
    finish({ status: 'resolved', results: [] });
  });

  it('dois usos pendentes têm painéis separados', () => {
    setup([usageRow(), usageRow({ id: 'u2', ability_name: 'Grito de Guerra', user_name: 'Rute' })]);
    expect(screen.getAllByRole('button', { name: 'Resolver TR' })).toHaveLength(2);
  });
});
