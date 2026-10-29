// A Hotbar: as Habilidades em abas por espaço do turno, as peças com o nome escrito e o Cartão de
// Habilidade acima dela, de onde se usa. Ela recebe as Habilidades já com os usos e o motivo de
// bloqueio e devolve o pedido de usar. Termos: CONTEXT.md (Hotbar, Cartão de Habilidade).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import type { AbilityDefinition } from '@/content/schemas';
import { Hotbar, type HotbarEntry, type HotbarItem } from './Hotbar';

const ability = (id: string, over: Partial<AbilityDefinition> = {}): AbilityDefinition => ({
  id,
  name: id,
  sourceType: 'vocation',
  sourceId: 'guerreiro',
  minLevel: 1,
  actionType: 'action',
  usageType: 'unlimited',
  effect: `Texto de ${id}`,
  ...over,
});

const entry = (a: AbilityDefinition, over: Partial<HotbarEntry> = {}): HotbarEntry => ({
  ability: a,
  remainingUses: undefined,
  blockedReason: null,
  ...over,
});

const onUse = vi.fn();
const onOpenDice = vi.fn();
const onCancelUse = vi.fn();
const onUseItem = vi.fn();

const show = (entries: HotbarEntry[], props: Partial<Parameters<typeof Hotbar>[0]> = {}) =>
  render(
    <Hotbar
      entries={entries}
      onUse={onUse}
      onOpenDice={onOpenDice}
      onCancelUse={onCancelUse}
      onUseItem={onUseItem}
      {...props}
    />,
  );

const tabNames = () =>
  within(screen.getByRole('tablist', { name: 'Grupos da Hotbar' }))
    .getAllByRole('tab')
    .map((t) => t.textContent);
const tile = (name: RegExp | string) => screen.getByRole('button', { name });

const MIXED = [
  entry(ability('Golpe A')),
  entry(ability('Golpe B')),
  entry(ability('Impulso', { actionType: 'bonus_action' })),
  entry(ability('Resposta', { actionType: 'reaction' })),
  entry(ability('Dom Constante', { actionType: 'passive' })),
  entry(ability('Fé Firme', { actionType: 'passive' })),
];

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('Hotbar: as abas', () => {
  it('só mostra as abas com conteúdo, na ordem do turno, com a contagem', () => {
    show(MIXED);
    expect(tabNames()).toEqual(['Ação 2', 'Ação Bônus 1', 'Reação 1', 'Passivas 2']);
  });

  it('a Ação Livre ganha a própria aba', () => {
    show([entry(ability('Livre1', { actionType: 'free_action' })), entry(ability('A'))]);
    expect(tabNames()).toEqual(['Ação 1', 'Livre 1']);
  });

  it('abre na primeira aba e mostra só as peças dela', () => {
    show(MIXED);
    expect(screen.getByRole('tab', { name: /^Ação 2/ })).toHaveAttribute('aria-selected', 'true');
    expect(tile(/^Golpe A/)).toBeInTheDocument();
    expect(tile(/^Golpe B/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Impulso/ })).not.toBeInTheDocument();
  });

  it('trocar de aba troca as peças e a aba escolhida se mantém quando os dados mudam', () => {
    const { rerender } = show(MIXED);
    fireEvent.click(screen.getByRole('tab', { name: /^Reação/ }));
    expect(tile(/^Resposta/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Golpe A/ })).not.toBeInTheDocument();
    rerender(
      <Hotbar
        entries={[...MIXED, entry(ability('Golpe C'))]}
        onUse={onUse}
        onOpenDice={onOpenDice}
      />,
    );
    expect(screen.getByRole('tab', { name: /^Reação/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('se a aba escolhida some, cai na primeira aba com conteúdo', () => {
    const { rerender } = show(MIXED);
    fireEvent.click(screen.getByRole('tab', { name: /^Reação/ }));
    rerender(
      <Hotbar
        entries={MIXED.filter((e) => e.ability.actionType !== 'reaction')}
        onUse={onUse}
        onOpenDice={onOpenDice}
      />,
    );
    expect(screen.getByRole('tab', { name: /^Ação 2/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('as setas movem entre as abas', () => {
    show(MIXED);
    const first = screen.getByRole('tab', { name: /^Ação 2/ });
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /^Ação Bônus/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    fireEvent.keyDown(screen.getByRole('tab', { name: /^Ação Bônus/ }), { key: 'ArrowLeft' });
    expect(first).toHaveAttribute('aria-selected', 'true');
  });

  it('sem Habilidades, avisa e ainda tem os Dados', () => {
    show([]);
    expect(screen.getByText('Nenhuma habilidade disponível.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dados' }));
    expect(onOpenDice).toHaveBeenCalledTimes(1);
  });

  it('os Dados ficam na ponta das abas', () => {
    show(MIXED);
    const dice = screen.getByRole('button', { name: 'Dados' });
    expect(dice).toBeInTheDocument();
    fireEvent.click(dice);
    expect(onOpenDice).toHaveBeenCalledTimes(1);
  });
});

describe('Hotbar: as peças', () => {
  it('a peça diz o nome, os usos e o custo de Fé', () => {
    show([
      entry(ability('Golpe Sísmico', { usageType: 'combat', maxUses: 1 }), { remainingUses: 1 }),
      entry(ability('Prece', { usageType: 'faith_cost', faithCost: 10 })),
      entry(ability('Postura')),
    ]);
    expect(screen.getByRole('button', { name: /^Golpe Sísmico/ })).toHaveTextContent('1/1');
    expect(screen.getByRole('button', { name: /^Prece/ })).toHaveTextContent('10 Fé');
    expect(screen.getByRole('button', { name: /^Postura/ })).toHaveTextContent('Ilimitado');
  });

  it('o nome acessível diz o nome, o espaço do turno e os usos', () => {
    show([
      entry(ability('Golpe Sísmico', { usageType: 'combat', maxUses: 1 }), { remainingUses: 1 }),
    ]);
    expect(
      screen.getByRole('button', { name: 'Golpe Sísmico, Ação, 1 de 1 por combate' }),
    ).toBeInTheDocument();
  });

  it('o custo de Fé também entra no nome acessível', () => {
    show([entry(ability('Prece', { usageType: 'faith_cost', faithCost: 10 }))]);
    expect(screen.getByRole('button', { name: 'Prece, Ação, custa 10 de Fé' })).toBeInTheDocument();
  });

  it('a peça bloqueada fica marcada, mas ainda abre o Cartão', () => {
    show([entry(ability('Golpe A'), { blockedReason: 'Não é o seu turno' })]);
    const t = tile(/^Golpe A/);
    expect(t).toHaveAttribute('data-blocked');
    fireEvent.click(t);
    expect(screen.getByRole('dialog', { name: 'Golpe A' })).toBeInTheDocument();
  });

  it('a peça passiva é marcada como passiva', () => {
    show(MIXED);
    fireEvent.click(screen.getByRole('tab', { name: /^Passivas/ }));
    expect(tile(/^Dom Constante/)).toHaveAttribute('data-passive');
    expect(tile(/^Dom Constante/)).toHaveAccessibleName('Dom Constante, Passiva');
  });
});

describe('Hotbar: o Cartão de Habilidade', () => {
  it('abre por clique e mostra o tipo, o custo, os usos, a recarga e o texto', () => {
    show([
      entry(
        ability('Golpe Sísmico', {
          usageType: 'short_rest',
          maxUses: 2,
          faithCost: 5,
          effect: 'Racha o chão.',
        }),
        { remainingUses: 1 },
      ),
    ]);
    fireEvent.click(tile(/^Golpe Sísmico/));
    const card = screen.getByRole('dialog', { name: 'Golpe Sísmico' });
    expect(card).toHaveTextContent('Ação');
    expect(card).toHaveTextContent('Custo: 5 de Fé');
    expect(card).toHaveTextContent('1 de 2');
    expect(card).toHaveTextContent('por Descanso Curto');
    expect(card).toHaveTextContent('Racha o chão.');
  });

  it('com TR, mostra a CD da Habilidade e o atributo do TR', () => {
    show([
      entry(
        ability('Tática do Cântaro', {
          combatEffect: {
            targets: 'enemies',
            save: { attribute: 'sab' },
            apply: [{ conditionId: 'amedrontado', rounds: 1 }],
          },
        } as Partial<AbilityDefinition>),
        { cd: 13 },
      ),
    ]);
    fireEvent.click(tile(/^Tática do Cântaro/));
    const card = screen.getByRole('dialog', { name: 'Tática do Cântaro' });
    expect(card).toHaveTextContent('CD 13');
    expect(card).toHaveTextContent('TR de Sabedoria');
  });

  it('abre ao segurar (450 ms) e o clique que vem depois não fecha nem abre de novo', () => {
    show([entry(ability('Golpe A'))]);
    const t = tile(/^Golpe A/);
    fireEvent.pointerDown(t, { pointerType: 'touch' });
    act(() => {
      vi.advanceTimersByTime(449);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(screen.getByRole('dialog', { name: 'Golpe A' })).toBeInTheDocument();
    fireEvent.pointerUp(t);
    fireEvent.click(t);
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('soltar antes dos 450 ms não abre sozinho; o toque abre pelo clique', () => {
    show([entry(ability('Golpe A'))]);
    const t = tile(/^Golpe A/);
    fireEvent.pointerDown(t, { pointerType: 'touch' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.pointerUp(t);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(t);
    expect(screen.getByRole('dialog', { name: 'Golpe A' })).toBeInTheDocument();
  });

  it('o foco entra no Cartão e volta à peça ao fechar', () => {
    show([entry(ability('Golpe A'))]);
    const t = tile(/^Golpe A/);
    t.focus();
    fireEvent.click(t);
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(t);
  });

  it('fecha por Esc e ao trocar de aba', () => {
    show(MIXED);
    fireEvent.click(tile(/^Golpe A/));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(tile(/^Golpe A/));
    fireEvent.click(screen.getByRole('tab', { name: /^Reação/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Hotbar: usar', () => {
  it('Usar pede o uso uma vez e fecha o Cartão', () => {
    show([entry(ability('Golpe A'))]);
    fireEvent.click(tile(/^Golpe A/));
    const card = screen.getByRole('dialog');
    fireEvent.click(within(card).getByRole('button', { name: 'Usar' }));
    expect(onUse).toHaveBeenCalledTimes(1);
    expect(onUse).toHaveBeenCalledWith(expect.objectContaining({ id: 'Golpe A' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('bloqueada: Usar fica desabilitado e o motivo aparece', () => {
    show([entry(ability('Golpe A'), { blockedReason: 'Fé Insuficiente' })]);
    fireEvent.click(tile(/^Golpe A/));
    const card = screen.getByRole('dialog');
    expect(within(card).getByRole('button', { name: 'Usar' })).toBeDisabled();
    expect(card).toHaveTextContent('Fé Insuficiente');
  });

  it('enquanto grava, Usar fica desabilitado', () => {
    show([entry(ability('Golpe A'))], { busy: true });
    fireEvent.click(tile(/^Golpe A/));
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Usar' })).toBeDisabled();
  });

  it('a passiva não tem Usar', () => {
    show(MIXED);
    fireEvent.click(screen.getByRole('tab', { name: /^Passivas/ }));
    fireEvent.click(tile(/^Dom Constante/));
    const card = screen.getByRole('dialog');
    expect(within(card).queryByRole('button', { name: 'Usar' })).not.toBeInTheDocument();
    expect(card).toHaveTextContent('Texto de Dom Constante');
  });

  it('com a escolha de alvos pedida, o Cartão mostra o painel de alvos no lugar do Usar', () => {
    show([entry(ability('Golpe A'))], {
      targetingId: 'Golpe A',
      renderTargeting: (a) => <p>Alvos de {a.name}</p>,
    });
    fireEvent.click(tile(/^Golpe A/));
    const card = screen.getByRole('dialog');
    expect(card).toHaveTextContent('Alvos de Golpe A');
    expect(within(card).queryByRole('button', { name: 'Usar' })).not.toBeInTheDocument();
  });

  it('fechar o Cartão cancela a escolha de alvos', () => {
    show([entry(ability('Golpe A'))], { targetingId: 'Golpe A', renderTargeting: () => <p>x</p> });
    fireEvent.click(tile(/^Golpe A/));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onCancelUse).toHaveBeenCalledTimes(1);
  });
});

const BALSAMO: HotbarItem = {
  id: 'ci1',
  name: 'Bálsamo de Gileade',
  quantity: 2,
  description: 'Cura 1d4 PV.',
};
const RACAO: HotbarItem = {
  id: 'ci2',
  name: 'Ração',
  quantity: 3,
  description: 'Sustento no Descanso Longo.',
};

describe('Hotbar: a aba Itens', () => {
  it('fica entre a Livre e as Passivas, com a contagem dos itens', () => {
    show(MIXED, { items: [BALSAMO, RACAO] });
    expect(tabNames()).toEqual(['Ação 2', 'Ação Bônus 1', 'Reação 1', 'Itens 2', 'Passivas 2']);
  });

  it('sem consumíveis nem munição, a aba some', () => {
    show(MIXED, { items: [], ammo: null });
    expect(tabNames()).not.toContain('Itens 0');
    expect(screen.queryByRole('tab', { name: /^Itens/ })).not.toBeInTheDocument();
  });

  it('só com munição, a aba existe e conta o contador', () => {
    show([], { items: [], ammo: { name: 'Flechas', quantity: 12 } });
    expect(tabNames()).toEqual(['Itens 1']);
  });

  it('mostra cada consumível com a quantidade, e o nome acessível diz as unidades', () => {
    show([], { items: [BALSAMO, RACAO] });
    expect(tile('Bálsamo de Gileade, 2 unidades')).toHaveTextContent('×2');
    expect(tile('Ração, 3 unidades')).toHaveTextContent('×3');
  });

  it('um consumível de uma só unidade diz "1 unidade"', () => {
    show([], { items: [{ ...BALSAMO, quantity: 1 }] });
    expect(tile('Bálsamo de Gileade, 1 unidade')).toBeInTheDocument();
  });

  it('a munição é um contador, não um botão', () => {
    show([], { items: [BALSAMO], ammo: { name: 'Flechas', quantity: 12 } });
    expect(screen.getByText('Flechas: 12')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Flechas/ })).not.toBeInTheDocument();
  });

  it('o consumível abre o mesmo Cartão, com o texto e o Usar', () => {
    show([], { items: [BALSAMO] });
    fireEvent.click(tile(/^Bálsamo de Gileade/));
    const card = screen.getByRole('dialog', { name: 'Bálsamo de Gileade' });
    expect(card).toHaveTextContent('Cura 1d4 PV.');
    expect(card).toHaveTextContent('2 unidades');
    expect(within(card).getByRole('button', { name: 'Usar' })).toBeEnabled();
  });

  it('Usar pede o consumo uma vez e fecha o Cartão', () => {
    show([], { items: [BALSAMO] });
    fireEvent.click(tile(/^Bálsamo de Gileade/));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Usar' }));
    expect(onUseItem).toHaveBeenCalledTimes(1);
    expect(onUseItem).toHaveBeenCalledWith(expect.objectContaining({ id: 'ci1' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('enquanto grava, o Usar do consumível fica desabilitado', () => {
    show([], { items: [BALSAMO], busy: true });
    fireEvent.click(tile(/^Bálsamo de Gileade/));
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Usar' })).toBeDisabled();
  });

  it('abre ao segurar, como as Habilidades', () => {
    show([], { items: [BALSAMO] });
    const t = tile(/^Bálsamo de Gileade/);
    fireEvent.pointerDown(t, { pointerType: 'touch' });
    act(() => {
      vi.advanceTimersByTime(451);
    });
    expect(screen.getByRole('dialog', { name: 'Bálsamo de Gileade' })).toBeInTheDocument();
  });
});
