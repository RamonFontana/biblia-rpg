// O painel de uso de uma Habilidade com efeito de combate: o jogador marca os alvos, vê o que o app
// aplica e o que fica com o Mestre, usa e lê o resultado por alvo. Termos: CONTEXT.md (Habilidade).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { AbilityDefinition } from '@/content/schemas';
import type { AttackTarget } from '@/lib/attackSetup';
import { AbilityUsePanel } from './AbilityUsePanel';

afterEach(cleanup);

const base: AbilityDefinition = {
  id: 'tribe-levi-16-palavra-de-auto',
  name: 'Palavra de Autoridade',
  sourceType: 'tribe',
  sourceId: 'levi',
  minLevel: 16,
  actionType: 'action',
  usageType: 'combat',
  maxUses: 1,
  effect: 'Paralisa inimigo por 1 turno (peso da culpa).',
  combatEffect: { targets: 'enemy', apply: [{ conditionId: 'paralisado', rounds: 1 }] },
};
const target = (id: string, name: string): AttackTarget => ({
  participantId: id,
  entityId: `e-${id}`,
  entityType: 'enemy',
  name,
  ac: 12,
  conditionIds: [],
});
const pool = [target('p2', 'Filisteu'), target('p3', 'Bandido')];

const setup = (over: Partial<Parameters<typeof AbilityUsePanel>[0]> = {}) => {
  const onUse = vi.fn().mockResolvedValue({
    id: 'use-1',
    results: [
      {
        participantId: 'p2',
        name: 'Filisteu',
        conditions: [{ conditionId: 'paralisado', duration: 1 }],
        messages: [],
      },
    ],
  });
  const onClose = vi.fn();
  render(
    <AbilityUsePanel
      ability={base}
      targets={pool}
      blockedReason={null}
      onUse={onUse}
      onClose={onClose}
      {...over}
    />,
  );
  return { onUse, onClose };
};

describe('AbilityUsePanel', () => {
  it('mostra a Habilidade, o que o app aplica e o texto que fica com o Mestre', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Palavra de Autoridade' })).toBeVisible();
    expect(screen.getByText('O app aplica: Paralisado por 1 rodada')).toBeVisible();
    expect(screen.getByText(/Paralisa inimigo por 1 turno/)).toBeVisible();
  });

  it('uma Condição sem duração fica até ser removida', () => {
    setup({
      ability: {
        ...base,
        combatEffect: { targets: 'aggressor', apply: [{ conditionId: 'amedrontado' }] },
      },
    });
    expect(screen.getByText('O app aplica: Amedrontado até ser removido')).toBeVisible();
  });

  it('um alvo só: escolhe de uma lista e usa', async () => {
    const { onUse } = setup();
    fireEvent.change(screen.getByLabelText('Alvo'), { target: { value: 'p2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Usar Habilidade' }));
    expect(onUse).toHaveBeenCalledWith([pool[0]]);
  });

  it('vários alvos: marca quantos quiser', async () => {
    const { onUse } = setup({
      ability: { ...base, combatEffect: { targets: 'enemies', apply: base.combatEffect!.apply } },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Filisteu' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Bandido' }));
    fireEvent.click(screen.getByRole('button', { name: 'Usar Habilidade' }));
    expect(onUse).toHaveBeenCalledWith(pool);
  });

  it('sem alvo marcado, o botão fica desabilitado', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Usar Habilidade' })).toBeDisabled();
  });

  it('bloqueada, mostra o motivo e não deixa usar nem com alvo marcado', async () => {
    setup({ blockedReason: 'Não é o seu turno' });
    fireEvent.change(screen.getByLabelText('Alvo'), { target: { value: 'p2' } });
    expect(screen.getByText('Não é o seu turno')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Usar Habilidade' })).toBeDisabled();
  });

  it('sem alvos possíveis no combate, avisa', () => {
    setup({ targets: [] });
    expect(screen.getByText('Nenhum alvo possível no combate.')).toBeVisible();
  });

  it('depois de usar, mostra o resultado por alvo', async () => {
    setup();
    fireEvent.change(screen.getByLabelText('Alvo'), { target: { value: 'p2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Usar Habilidade' }));
    expect(await screen.findByText('Filisteu: Paralisado')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Usar Habilidade' })).not.toBeInTheDocument();
  });

  it('o alvo que resistiu aparece como resistiu, com a frase de proteção', async () => {
    const onUse = vi.fn().mockResolvedValue({
      id: 'use-1',
      results: [
        {
          participantId: 'p2',
          name: 'Filisteu',
          conditions: [],
          messages: ['Resistência Nv4: imune a Paralisado'],
        },
      ],
    });
    setup({ onUse });
    fireEvent.change(screen.getByLabelText('Alvo'), { target: { value: 'p2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Usar Habilidade' }));
    expect(await screen.findByText('Filisteu: resistiu')).toBeVisible();
    expect(screen.getByText('Resistência Nv4: imune a Paralisado')).toBeVisible();
  });

  it('mostra o erro do banco e deixa tentar de novo', async () => {
    const onUse = vi.fn().mockRejectedValue(new Error('Não é o turno de quem usa a Habilidade'));
    setup({ onUse });
    fireEvent.change(screen.getByLabelText('Alvo'), { target: { value: 'p2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Usar Habilidade' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não é o turno de quem usa');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Usar Habilidade' })).toBeEnabled(),
    );
  });

  it('fechar chama onClose', async () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('AbilityUsePanel: Habilidade com TR', () => {
  const tactic: AbilityDefinition = {
    id: 'tribe-manasses-12-tatica-do-canta',
    name: 'Tática do Cântaro Quebrado',
    sourceType: 'tribe',
    sourceId: 'manasses',
    minLevel: 12,
    actionType: 'bonus_action',
    usageType: 'long_rest',
    maxUses: 1,
    effect: 'Inimigos 9m Teste SAB; falha = Amedrontado (1 min).',
    combatEffect: {
      targets: 'enemies',
      save: { attribute: 'sab' },
      apply: [{ conditionId: 'amedrontado', rounds: 10 }],
    },
  };
  const pendingOutcome = {
    id: 'use-1',
    results: [
      { participantId: 'p2', name: 'Filisteu', conditions: [], messages: [] },
      { participantId: 'p3', name: 'Bandido', conditions: [], messages: [] },
    ],
    pending: { cd: 17, attribute: 'sab' as const },
  };

  it('antes de usar, diz o TR dos alvos e a CD, e que os inimigos só ficam se falharem', () => {
    setup({ ability: tactic, cd: 17 });
    expect(screen.getByText(/TR de Sabedoria dos alvos \(CD 17\)/)).toBeVisible();
    expect(screen.getByText(/quem falhar/i)).toBeVisible();
  });

  it('depois de usar, espera o Mestre lançar o TR e não mostra "resistiu"', async () => {
    const { onUse } = setup({ ability: tactic, cd: 17 });
    onUse.mockResolvedValue(pendingOutcome);
    fireEvent.click(screen.getByLabelText('Filisteu'));
    fireEvent.click(screen.getByRole('button', { name: 'Usar Habilidade' }));
    await waitFor(() =>
      expect(
        screen.getByText('Aguardando o Mestre lançar o TR de Sabedoria (CD 17).'),
      ).toBeVisible(),
    );
    expect(screen.queryByText(/resistiu/)).toBeNull();
  });

  const renderTactic = (liveUse?: unknown) => {
    const onUse = vi.fn().mockResolvedValue(pendingOutcome);
    const element = (live?: unknown) => (
      <AbilityUsePanel
        ability={tactic}
        targets={pool}
        blockedReason={null}
        cd={17}
        onUse={onUse}
        onClose={vi.fn()}
        liveUse={live as never}
      />
    );
    const view = render(element(liveUse));
    return { rerender: (live: unknown) => view.rerender(element(live)) };
  };
  const useThePanel = async () => {
    fireEvent.click(screen.getByLabelText('Filisteu'));
    fireEvent.click(screen.getByRole('button', { name: 'Usar Habilidade' }));
    await waitFor(() => expect(screen.getByText(/Aguardando o Mestre/)).toBeVisible());
  };

  it('quando o Mestre resolve, mostra o resultado de cada alvo', async () => {
    const view = renderTactic();
    await useThePanel();
    view.rerender({
      id: 'use-1',
      status: 'resolved',
      cd: 17,
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
    });
    expect(screen.getByText('Filisteu: Amedrontado (d20 4, total 9)')).toBeVisible();
    expect(screen.getByText('Bandido: passou no TR (d20 15, total 19)')).toBeVisible();
    expect(screen.queryByText(/Aguardando o Mestre/)).toBeNull();
  });

  it('o resultado de outro uso não aparece neste painel', async () => {
    const view = renderTactic();
    await useThePanel();
    view.rerender({ id: 'outro', status: 'resolved', cd: 17, targets: [] });
    expect(screen.getByText(/Aguardando o Mestre/)).toBeVisible();
  });

  it('um uso que expirou diz que não teve efeito', async () => {
    const view = renderTactic();
    await useThePanel();
    view.rerender({ id: 'use-1', status: 'expired', cd: 17, targets: [] });
    expect(screen.getByText(/combate acabou antes do TR/)).toBeVisible();
  });
});

describe('AbilityUsePanel: Habilidade que tira Condição', () => {
  const ally = (id: string, name: string, conditionIds: string[]): AttackTarget => ({
    participantId: id,
    entityId: `c-${id}`,
    entityType: 'player',
    name,
    ac: 12,
    conditionIds,
  });
  const purificacao: AbilityDefinition = {
    id: 'vocation-sacerdote-6-purificacao',
    name: 'Purificação',
    sourceType: 'vocation',
    sourceId: 'sacerdote',
    minLevel: 6,
    actionType: 'action',
    usageType: 'short_rest',
    maxUses: 1,
    effect: 'Encerra Amedrontado, Atordoado, Envenenado ou Possessão.',
    combatEffect: {
      targets: 'ally',
      remove: { mode: 'choice', conditionIds: ['amedrontado', 'atordoado', 'envenenado'] },
    },
  };
  const ungido: AbilityDefinition = {
    ...purificacao,
    id: 'tribe-aser-12-ungido',
    name: 'Ungido',
    effect: 'Cura 3d8 PV e remove envenenamento/doença do alvo.',
    combatEffect: { targets: 'ally', remove: { mode: 'fixed', conditionIds: ['envenenado'] } },
  };
  const unificador: AbilityDefinition = {
    ...purificacao,
    id: 'tribe-manasses-20-o-unificador',
    name: 'O Unificador',
    effect: 'Aliados 18m perdem condição negativa e resistem dano mundano.',
    combatEffect: { targets: 'allies', remove: { mode: 'per_target' } },
  };
  const bob = ally('p3', 'Bob', ['envenenado', 'cego']);
  const eli = ally('p4', 'Eliabe', ['caido']);

  const removalOutcome = (removed: string[], messages: string[] = []) => ({
    id: 'use-9',
    results: [{ participantId: 'p3', name: 'Bob', conditions: [], removed, messages }],
  });
  const render1 = (
    ability: AbilityDefinition,
    targets: AttackTarget[],
    outcome = removalOutcome(['envenenado']),
  ) => {
    const onUse = vi.fn().mockResolvedValue(outcome);
    render(
      <AbilityUsePanel
        ability={ability}
        targets={targets}
        blockedReason={null}
        onUse={onUse}
        onClose={vi.fn()}
      />,
    );
    return { onUse };
  };

  it('diz o que o app tira e que a cura e o dano do texto ficam com o Mestre', () => {
    render1(ungido, [bob]);
    expect(screen.getByText('O app tira: Envenenado do aliado')).toBeVisible();
    expect(screen.queryByText(/O app aplica/)).toBeNull();
    expect(screen.getByText(/cura, dano e bônus do texto ficam com o Mestre/i)).toBeVisible();
    expect(screen.getByText(/Cura 3d8 PV/)).toBeVisible();
  });

  it('a lista de Purificação mostra as Condições que ela tira', () => {
    render1(purificacao, [bob]);
    expect(
      screen.getByText('O app tira: Amedrontado, Atordoado ou Envenenado do aliado'),
    ).toBeVisible();
  });

  it('escolhida: só oferece as Condições da lista que o aliado tem', () => {
    render1(purificacao, [bob]);
    fireEvent.change(screen.getByLabelText('Alvo'), { target: { value: 'p3' } });
    const options = within(screen.getByLabelText('Condição que sai de Bob'))
      .getAllByRole('option')
      .map((o) => o.textContent)
      .filter((t) => t !== 'Escolha...');
    expect(options).toEqual(['Envenenado']);
  });

  it('escolhida: só usa depois de escolher a Condição, e manda a escolha', () => {
    const { onUse } = render1(purificacao, [bob]);
    fireEvent.change(screen.getByLabelText('Alvo'), { target: { value: 'p3' } });
    expect(screen.getByRole('button', { name: 'Usar Habilidade' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Condição que sai de Bob'), {
      target: { value: 'envenenado' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Usar Habilidade' }));
    expect(onUse).toHaveBeenCalledWith([bob], { p3: 'envenenado' });
  });

  it('escolhida: o aliado sem nada da lista não pede escolha e o jogador é avisado', () => {
    const { onUse } = render1(purificacao, [eli]);
    fireEvent.change(screen.getByLabelText('Alvo'), { target: { value: 'p4' } });
    expect(screen.queryByLabelText('Condição que sai de Eliabe')).toBeNull();
    expect(screen.getByText('Eliabe não tem Condição que esta Habilidade tire.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Usar Habilidade' }));
    expect(onUse).toHaveBeenCalledWith([eli], {});
  });

  it('fixa: não pede escolha, mostra o que sai e usa', () => {
    const { onUse } = render1(ungido, [bob]);
    fireEvent.change(screen.getByLabelText('Alvo'), { target: { value: 'p3' } });
    expect(screen.queryByLabelText(/Condição que sai de/)).toBeNull();
    expect(screen.getByText('Sai de Bob: Envenenado')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Usar Habilidade' }));
    expect(onUse).toHaveBeenCalledWith([bob], {});
  });

  it('uma por alvo: cada aliado marcado pede a sua escolha, entre as Condições que ele tem', () => {
    const { onUse } = render1(unificador, [bob, eli]);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Bob' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Eliabe' }));
    const button = screen.getByRole('button', { name: 'Usar Habilidade' });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Condição que sai de Bob'), {
      target: { value: 'cego' },
    });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Condição que sai de Eliabe'), {
      target: { value: 'caido' },
    });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onUse).toHaveBeenCalledWith([bob, eli], { p3: 'cego', p4: 'caido' });
  });

  it('desmarcar o aliado tira a escolha dele', () => {
    const { onUse } = render1(unificador, [bob, eli]);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Bob' }));
    fireEvent.change(screen.getByLabelText('Condição que sai de Bob'), {
      target: { value: 'cego' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Bob' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Eliabe' }));
    fireEvent.change(screen.getByLabelText('Condição que sai de Eliabe'), {
      target: { value: 'caido' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Usar Habilidade' }));
    expect(onUse).toHaveBeenCalledWith([eli], { p4: 'caido' });
  });

  it('depois de usar, mostra o que saiu de cada alvo', async () => {
    render1(ungido, [bob]);
    fireEvent.change(screen.getByLabelText('Alvo'), { target: { value: 'p3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Usar Habilidade' }));
    expect(await screen.findByText('Bob: deixou de estar Envenenado')).toBeVisible();
    expect(screen.queryByText(/resistiu/)).toBeNull();
  });

  it('o aliado que não tinha o que tirar aparece com o aviso, sem "resistiu"', async () => {
    render1(ungido, [eli], {
      id: 'use-9',
      results: [
        {
          participantId: 'p3',
          name: 'Bob',
          conditions: [],
          removed: [],
          messages: ['não tinha Envenenado'],
        },
      ],
    });
    fireEvent.change(screen.getByLabelText('Alvo'), { target: { value: 'p4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Usar Habilidade' }));
    expect(await screen.findByText('Bob: não tinha Envenenado')).toBeVisible();
    expect(screen.queryByText(/resistiu/)).toBeNull();
  });
});
