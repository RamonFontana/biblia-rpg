// O painel de ataque do jogador: arma, alvo, d20 digitado, "Acertou/Errou" sem mostrar a CA, dano
// digitado com o lembrete do dado e o envio. O serviço é falso. Termos: CONTEXT.md (Ataque, Acerto
// Crítico, Falha Crítica, CA).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({ submitAttack: vi.fn() }));
vi.mock('@/services/attackService', () => ({ submitAttack: h.submitAttack }));

import { AttackPanel } from './AttackPanel';

const targets = [
  { participantId: 'p-rute', name: 'Rute', ac: 12 },
  { participantId: 'p-fil', name: 'Filisteu', ac: 15 },
];
const equipped = (slug: string | null) => ({
  attributes: { for: 16, des: 12 }, // FOR +3, DES +1
  level: 1, // Proficiência +2
  vocation: 'Guerreiro',
  equipment: { head: null, body: null, mainHand: slug ? 'ci-1' : null, offHand: null },
  character_items: slug ? [{ id: 'ci-1', items: { slug, name: slug } }] : [],
});

const onActionUsed = vi.fn();
const show = (over: Partial<React.ComponentProps<typeof AttackPanel>> = {}) =>
  render(
    <AttackPanel
      character={equipped('espada_longa')}
      attackerParticipantId="p-me"
      targets={targets}
      actionUsed={false}
      onActionUsed={onActionUsed}
      {...over}
    />,
  );
const pick = (name: string) =>
  fireEvent.change(screen.getByLabelText('Alvo'), {
    target: { value: targets.find((t) => t.name === name)!.participantId },
  });
const roll = (value: string) =>
  fireEvent.change(screen.getByLabelText('d20 natural'), { target: { value } });
const attack = () => fireEvent.click(screen.getByRole('button', { name: 'Atacar' }));

beforeEach(() => {
  h.submitAttack.mockResolvedValue('atk-1');
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AttackPanel: a arma', () => {
  it('mostra a arma da mão principal com o dado', () => {
    show();
    expect(screen.getByText(/Espada Longa/)).toBeInTheDocument();
    expect(screen.getByText(/1d8 cortante/)).toBeInTheDocument();
    expect(screen.queryByText('Não proficiente')).toBeNull();
  });

  it('avisa quando a Vocação não é proficiente com a arma', () => {
    show({ character: { ...equipped('espada_longa'), vocation: 'Sacerdote' } });
    expect(screen.getByText('Não proficiente')).toBeInTheDocument();
  });

  it('sem arma na mão, ataca desarmado', () => {
    show({ character: equipped(null) });
    expect(screen.getByText(/Desarmado/)).toBeInTheDocument();
  });
});

describe('AttackPanel: antes de atacar', () => {
  it('com a Ação já usada, não deixa atacar', () => {
    show({ actionUsed: true });
    expect(screen.getByText(/Ação principal já usada/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atacar' })).toBeDisabled();
  });

  it('sem alvos no combate, avisa', () => {
    show({ targets: [] });
    expect(screen.getByText(/Nenhum alvo/)).toBeInTheDocument();
  });

  it('exige o alvo e um d20 de 1 a 20', () => {
    show();
    attack();
    expect(screen.getByText('Escolha o alvo.')).toBeInTheDocument();
    pick('Rute');
    attack();
    expect(screen.getByText('Insira o d20 (1-20).')).toBeInTheDocument();
    roll('21');
    attack();
    expect(screen.getByText('Insira o d20 (1-20).')).toBeInTheDocument();
    expect(h.submitAttack).not.toHaveBeenCalled();
  });

  it('lista os alvos, aliados e inimigos, só pelo nome (a CA fica escondida)', () => {
    show();
    expect(screen.getByRole('option', { name: 'Rute' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Filisteu' })).toBeInTheDocument();
    expect(screen.queryByText(/15/)).toBeNull();
  });
});

describe('AttackPanel: errar', () => {
  it('d20 baixo contra a CA: mostra "Errou", registra o ataque sem dano e usa a Ação', async () => {
    show();
    pick('Filisteu');
    roll('5'); // 5 + 3 + 2 = 10 contra CA 15
    attack();
    expect(await screen.findByText('Errou')).toBeInTheDocument();
    await waitFor(() => expect(h.submitAttack).toHaveBeenCalled());
    expect(h.submitAttack.mock.calls[0][0]).toMatchObject({
      attackerParticipantId: 'p-me',
      targetParticipantId: 'p-fil',
      targetAc: 15,
      naturalRoll: 5,
      damage: 0,
      result: { hit: false, total: 10 },
    });
    await waitFor(() => expect(onActionUsed).toHaveBeenCalled());
    expect(screen.queryByText(/15/)).toBeNull();
  });

  it('1 natural é Falha Crítica', async () => {
    show();
    pick('Rute');
    roll('1');
    attack();
    expect(await screen.findByText('Falha Crítica')).toBeInTheDocument();
  });
});

describe('AttackPanel: acertar', () => {
  it('mostra "Acertou!", o lembrete do dado e só registra depois do dano', async () => {
    show();
    pick('Filisteu');
    roll('12'); // 12 + 5 = 17 contra CA 15
    attack();
    expect(await screen.findByText('Acertou!')).toBeInTheDocument();
    expect(screen.getByText('Role 1d8.')).toBeInTheDocument();
    expect(h.submitAttack).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Dano rolado'), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar dano' }));
    await waitFor(() => expect(h.submitAttack).toHaveBeenCalled());
    expect(h.submitAttack.mock.calls[0][0]).toMatchObject({
      naturalRoll: 12,
      damage: 9, // 6 do dado + 3 de FOR, uma vez só
      result: { hit: true, critical: false },
    });
    expect(await screen.findByText(/9 de dano/)).toBeInTheDocument();
    await waitFor(() => expect(onActionUsed).toHaveBeenCalled());
  });

  it('20 natural é Acerto Crítico e o lembrete dobra os dados', async () => {
    show();
    pick('Filisteu');
    roll('20');
    attack();
    expect(await screen.findByText('Acerto Crítico!')).toBeInTheDocument();
    expect(screen.getByText('Role 2d8.')).toBeInTheDocument();
  });

  it('o dano precisa ser um número de 0 para cima', async () => {
    show();
    pick('Rute');
    roll('15');
    attack();
    await screen.findByText('Acertou!');
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar dano' }));
    expect(screen.getByText('Insira o dano rolado.')).toBeInTheDocument();
    expect(h.submitAttack).not.toHaveBeenCalled();
  });

  it('desarmado não pede dado: o dano é 1 mais o modificador', async () => {
    show({ character: equipped(null) });
    pick('Rute');
    roll('15');
    attack();
    await screen.findByText('Acertou!');
    expect(screen.queryByLabelText('Dano rolado')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar dano' }));
    await waitFor(() => expect(h.submitAttack).toHaveBeenCalled());
    expect(h.submitAttack.mock.calls[0][0]).toMatchObject({ damage: 4 });
  });
});

describe('AttackPanel: falhas e novo ataque', () => {
  it('se o banco recusa, mostra o erro e não usa a Ação', async () => {
    h.submitAttack.mockRejectedValue(new Error('Não é o turno do atacante'));
    show();
    pick('Filisteu');
    roll('3');
    attack();
    expect(await screen.findByText(/Não é o turno do atacante/)).toBeInTheDocument();
    expect(onActionUsed).not.toHaveBeenCalled();
  });

  it('"Novo ataque" volta ao formulário', async () => {
    show();
    pick('Filisteu');
    roll('3');
    attack();
    await screen.findByText('Errou');
    await waitFor(() => expect(onActionUsed).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'Novo ataque' }));
    expect(screen.getByLabelText('d20 natural')).toHaveValue(null);
  });
});
