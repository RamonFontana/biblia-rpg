// A Hotbar do jogador ligada à ficha e ao combate: quando cada Habilidade fica bloqueada, o que
// usar uma grava e como o efeito de combate abre o painel de alvos no Cartão. As Habilidades são
// falsas para o teste não depender do conteúdo. Termos: CONTEXT.md (Hotbar, Cartão de Habilidade,
// Habilidade, Fé, Morrendo).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const h = vi.hoisted(() => ({
  consumeInventoryItem: vi.fn(),
  submitAbilityUse: vi.fn(),
  updateCharacter: vi.fn(),
  getAbilitiesForCharacter: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getSession: async () => ({ data: { session: null } }),
    },
  },
}));
vi.mock('@/data-access/characters', () => ({ updateCharacter: h.updateCharacter }));
vi.mock('@/data-access/inventory', () => ({
  addInventoryItem: vi.fn(),
  consumeInventoryItem: h.consumeInventoryItem,
  removeInventoryItem: vi.fn(),
  setInventoryQuantity: vi.fn(),
}));
vi.mock('@/utils/abilityUtils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/abilityUtils')>()),
  getAbilitiesForCharacter: h.getAbilitiesForCharacter,
}));
vi.mock('@/services/abilityService', () => ({ submitAbilityUse: h.submitAbilityUse }));
vi.mock('@/components/combat/AbilityUsePanel', async () => ({
  AbilityUsePanel: (await import('@/test/stubs')).makeStub('AbilityUsePanel'),
}));

import { clearStubs, stubProps } from '@/test/stubs';
import { useCombatStore, type CombatParticipant } from '@/store/combatStore';
import type { AbilityDefinition } from '@/content/schemas';
import type { Character } from '@/features/character-management/types';
import { PlayerHotbar } from './PlayerHotbar';

const ability = (id: string, over: Partial<AbilityDefinition> = {}): AbilityDefinition => ({
  id,
  name: id,
  sourceType: 'vocation',
  sourceId: 'guerreiro',
  minLevel: 1,
  actionType: 'action',
  usageType: 'long_rest',
  effect: 'Efeito',
  ...over,
});

const sheet = (over: Partial<Character> = {}): Character => ({
  id: 'c1',
  user_id: 'u1',
  name: 'Eliab',
  tribe: 'Judá',
  vocation: 'Guerreiro',
  level: 3,
  has_participated_in_session: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  stats: { pv: 12, current_pv: 9, ca: 11, faith: 50, current_faith: 40 },
  skills: { ability_uses: {} },
  ...over,
});

const participant = (over: Partial<CombatParticipant> = {}): CombatParticipant =>
  ({
    id: 'part-1',
    combat_id: 'combat-1',
    entity_id: 'c1',
    entity_type: 'player',
    hp_current: 9,
    initiative: 10,
    is_surprised: false,
    conditions: [],
    created_at: '',
    updated_at: '',
    ...over,
  }) as CombatParticipant;

const startCombat = (parts: CombatParticipant[], turnIndex = 0) =>
  useCombatStore.setState({
    activeCombat: {
      id: 'combat-1',
      session_id: 's',
      round_number: 1,
      current_turn_index: turnIndex,
      status: 'active',
      created_at: '',
      updated_at: '',
    },
    participants: parts,
    currentTurnParticipant: parts[turnIndex],
  });

const entities = [
  { id: 'c1', name: 'Eliab', totalAc: 14 },
  { id: 'c2', name: 'Rute', totalAc: 12 },
  { id: 'e1', name: 'Filisteu', totalAc: 15 },
];
const onCharacterPatch = vi.fn();
const onOpenDice = vi.fn();

const view = (character: Character | null = sheet(), ents = entities) =>
  render(
    <PlayerHotbar
      character={character}
      entities={ents}
      onCharacterPatch={onCharacterPatch}
      onOpenDice={onOpenDice}
    />,
  );

/** Abre o Cartão da peça (o nome da Habilidade de teste é o id). */
const openCard = (id: string) =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${id}`) }));
const card = () => screen.getByRole('dialog');
const pressUse = () =>
  act(async () => {
    fireEvent.click(within(card()).getByRole('button', { name: 'Usar' }));
  });
const useAbility = async (id: string) => {
  openCard(id);
  await pressUse();
};

beforeEach(() => {
  h.updateCharacter.mockResolvedValue(undefined);
  h.consumeInventoryItem.mockResolvedValue(undefined);
  h.getAbilitiesForCharacter.mockReturnValue([ability('a1')]);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  clearStubs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  useCombatStore.setState({
    activeCombat: null,
    participants: [],
    currentTurnParticipant: null,
    abilityUses: [],
    hasUsedMovement: false,
    hasUsedAction: false,
    hasUsedBonusAction: false,
    hasUsedReaction: false,
  });
});

describe('PlayerHotbar: as Habilidades do personagem', () => {
  it('busca pela tribo, vocação, nível e Caminhos escolhidos', () => {
    const path_choices = { tribe: { 4: 'A' as const }, vocation: 'B' as const };
    view(sheet({ level: 5, skills: { path_choices } }));
    expect(h.getAbilitiesForCharacter).toHaveBeenCalledWith('Judá', 'Guerreiro', 5, path_choices);
  });

  it.each([
    ['sem tribo', { tribe: '' }],
    ['sem vocação', { vocation: '' }],
    ['sem nível', { level: 0 }],
  ])('%s, não há Habilidades', (_name, over) => {
    view(sheet(over));
    expect(h.getAbilitiesForCharacter).not.toHaveBeenCalled();
    expect(screen.getByText('Nenhuma habilidade disponível.')).toBeInTheDocument();
  });

  it('sem personagem, a Hotbar nem aparece', () => {
    view(null);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('o nível que chega como texto vale como número', () => {
    view(sheet({ level: '4' as never }));
    expect(h.getAbilitiesForCharacter).toHaveBeenCalledWith('Judá', 'Guerreiro', 4, undefined);
  });

  it('os Dados abrem o diálogo de dados da tela', () => {
    view();
    fireEvent.click(screen.getByRole('button', { name: 'Dados' }));
    expect(onOpenDice).toHaveBeenCalledTimes(1);
  });
});

describe('PlayerHotbar: Habilidade bloqueada ou livre', () => {
  it('fora do combate, a Habilidade de combate fica bloqueada com o motivo', () => {
    h.getAbilitiesForCharacter.mockReturnValue([
      ability('a1', { usageType: 'combat' }),
      ability('a2'),
    ]);
    view();
    expect(screen.getByRole('button', { name: /^a1/ })).toHaveAttribute('data-blocked');
    expect(screen.getByRole('button', { name: /^a2/ })).not.toHaveAttribute('data-blocked');
    openCard('a1');
    expect(within(card()).getByRole('button', { name: 'Usar' })).toBeDisabled();
    expect(card()).toHaveTextContent('Apenas em combate');
  });

  it('em combate, a Habilidade de combate fica livre', () => {
    h.getAbilitiesForCharacter.mockReturnValue([ability('a1', { usageType: 'combat' })]);
    startCombat([participant()]);
    view();
    expect(screen.getByRole('button', { name: /^a1/ })).not.toHaveAttribute('data-blocked');
  });

  it('sem Fé suficiente, bloqueia com o motivo', () => {
    h.getAbilitiesForCharacter.mockReturnValue([ability('a1', { faithCost: 50 })]);
    view();
    openCard('a1');
    expect(within(card()).getByRole('button', { name: 'Usar' })).toBeDisabled();
    expect(card()).toHaveTextContent('Fé Insuficiente');
  });

  it('com Fé suficiente, fica livre', () => {
    h.getAbilitiesForCharacter.mockReturnValue([ability('a1', { faithCost: 10 })]);
    view();
    expect(screen.getByRole('button', { name: /^a1/ })).not.toHaveAttribute('data-blocked');
  });

  it('mostra os usos que restam e bloqueia sem usos', () => {
    h.getAbilitiesForCharacter.mockReturnValue([
      ability('a1', { maxUses: 2 }),
      ability('a2', { maxUses: 1 }),
      ability('a3'),
    ]);
    view(sheet({ skills: { ability_uses: { a1: 1, a2: 1 } } }));
    expect(screen.getByRole('button', { name: /^a1/ })).toHaveTextContent('1/2');
    expect(screen.getByRole('button', { name: /^a2/ })).toHaveTextContent('0/1');
    expect(screen.getByRole('button', { name: /^a2/ })).toHaveAttribute('data-blocked');
    openCard('a2');
    expect(card()).toHaveTextContent('Sem Usos');
    expect(screen.getByRole('button', { name: /^a3/ })).toHaveTextContent('Ilimitado');
  });
});

describe('PlayerHotbar: usar uma Habilidade', () => {
  it('grava mais um uso das Habilidades e preserva o resto de skills', async () => {
    view(sheet({ skills: { ability_uses: { a1: 1, x: 3 }, path_choices: { tribe: 'A' } } }));
    await useAbility('a1');
    expect(h.updateCharacter).toHaveBeenCalledWith('c1', {
      skills: { ability_uses: { a1: 2, x: 3 }, path_choices: { tribe: 'A' } },
    });
  });

  it('sem usos anteriores, começa em 1', async () => {
    view(sheet({ skills: undefined }));
    await useAbility('a1');
    expect(h.updateCharacter).toHaveBeenCalledWith('c1', { skills: { ability_uses: { a1: 1 } } });
  });

  it('a Habilidade que custa Fé também grava a Fé que sobra', async () => {
    h.getAbilitiesForCharacter.mockReturnValue([ability('a1', { faithCost: 15 })]);
    view();
    await useAbility('a1');
    expect(h.updateCharacter).toHaveBeenCalledWith('c1', {
      skills: { ability_uses: { a1: 1 } },
      stats: { pv: 12, current_pv: 9, ca: 11, faith: 50, current_faith: 25 },
    });
  });

  it('avisa a tela do que gravou, para a Hotbar mudar já', async () => {
    view();
    await useAbility('a1');
    expect(onCharacterPatch).toHaveBeenCalledWith({ skills: { ability_uses: { a1: 1 } } });
  });

  it('a falha ao gravar é registrada e a Hotbar volta a liberar', async () => {
    h.updateCharacter.mockRejectedValueOnce(new Error('sem rede'));
    view();
    await useAbility('a1');
    expect(console.error).toHaveBeenCalledWith('Failed to use ability:', expect.any(Error));
    expect(onCharacterPatch).not.toHaveBeenCalled();
    openCard('a1');
    await waitFor(() => expect(within(card()).getByRole('button', { name: 'Usar' })).toBeEnabled());
  });

  it('enquanto grava, nenhum Usar vale', async () => {
    let resolve: () => void = () => {};
    h.updateCharacter.mockReturnValueOnce(new Promise<void>((r) => (resolve = r)));
    h.getAbilitiesForCharacter.mockReturnValue([ability('a1'), ability('a2')]);
    view();
    await useAbility('a1');
    openCard('a2');
    expect(within(card()).getByRole('button', { name: 'Usar' })).toBeDisabled();
    await act(async () => resolve());
  });
});

// O dano e a cura do Mestre vão para o participante; a ficha só recebe o PV no fim do combate.
describe('PlayerHotbar: Habilidade com efeito de combate', () => {
  const parts = [
    participant({ id: 'part-1', entity_id: 'c1', initiative: 20 }),
    participant({ id: 'part-2', entity_id: 'c2', initiative: 15 }),
    participant({ id: 'part-3', entity_id: 'e1', entity_type: 'enemy', initiative: 10 }),
  ];
  const withEffect = (over: Partial<AbilityDefinition> = {}) =>
    ability('a1', {
      usageType: 'combat',
      maxUses: 1,
      combatEffect: { targets: 'enemy', apply: [{ conditionId: 'paralisado', rounds: 1 }] },
      ...over,
    });
  const outcome = { id: 'use-1', results: [] };
  const panel = () => stubProps('AbilityUsePanel')!;
  const submit = async (selected: unknown[] = []) =>
    act(async () => {
      await (panel().onUse as (s: unknown[]) => Promise<unknown>)(selected);
    });

  beforeEach(() => {
    h.getAbilitiesForCharacter.mockReturnValue([withEffect()]);
    h.submitAbilityUse.mockResolvedValue(outcome);
  });

  it('em combate, usar abre o painel de alvos no Cartão e não gasta nada ainda', async () => {
    startCombat(parts, 0);
    view();
    await useAbility('a1');
    expect(stubProps('AbilityUsePanel')).toBeDefined();
    expect(card()).toContainElement(document.querySelector('[data-stub="AbilityUsePanel"]'));
    expect(h.updateCharacter).not.toHaveBeenCalled();
  });

  it('o painel só oferece os alvos que o efeito permite (inimigo)', async () => {
    startCombat(parts, 0);
    view();
    await useAbility('a1');
    expect((panel().targets as { participantId: string }[]).map((t) => t.participantId)).toEqual([
      'part-3',
    ]);
  });

  it('sem combate, a Habilidade só gasta o uso, como antes', async () => {
    h.getAbilitiesForCharacter.mockReturnValue([withEffect({ usageType: 'long_rest' })]);
    view();
    await useAbility('a1');
    expect(stubProps('AbilityUsePanel')).toBeUndefined();
    expect(h.updateCharacter).toHaveBeenCalledTimes(1);
  });

  it('uma Habilidade sem efeito não abre o painel', async () => {
    h.getAbilitiesForCharacter.mockReturnValue([ability('a1', { usageType: 'long_rest' })]);
    startCombat(parts, 0);
    view();
    await useAbility('a1');
    expect(stubProps('AbilityUsePanel')).toBeUndefined();
    expect(h.updateCharacter).toHaveBeenCalledTimes(1);
  });

  it('no turno do jogador, o Usar não tem bloqueio', () => {
    startCombat(parts, 0);
    view();
    openCard('a1');
    expect(within(card()).getByRole('button', { name: 'Usar' })).toBeEnabled();
  });

  it('fora do turno, a Ação fica bloqueada com o motivo', () => {
    startCombat(parts, 1);
    view();
    expect(screen.getByRole('button', { name: /^a1/ })).toHaveAttribute('data-blocked');
    openCard('a1');
    expect(within(card()).getByRole('button', { name: 'Usar' })).toBeDisabled();
    expect(card()).toHaveTextContent('Não é o seu turno');
  });

  it('a Reação vale fora do turno', () => {
    h.getAbilitiesForCharacter.mockReturnValue([withEffect({ actionType: 'reaction' })]);
    startCombat(parts, 1);
    view();
    openCard('a1');
    expect(within(card()).getByRole('button', { name: 'Usar' })).toBeEnabled();
  });

  it('com a Ação já usada, bloqueia', () => {
    startCombat(parts, 0);
    useCombatStore.setState({ hasUsedAction: true });
    view();
    openCard('a1');
    expect(card()).toHaveTextContent('Ação já usada neste turno');
  });

  it('a 0 PV (Morrendo), o motivo é que não se usa Habilidade', () => {
    startCombat([participant({ id: 'part-1', entity_id: 'c1', hp_current: 0 }), ...parts.slice(1)]);
    view();
    openCard('a1');
    expect(card()).toHaveTextContent('Quem está a 0 PV não usa Habilidades');
  });

  it('usar manda ao serviço o participante, os alvos marcados e a ficha, e marca a Ação', async () => {
    startCombat(parts, 0);
    view();
    await useAbility('a1');
    const selected = (panel().targets as unknown[]).slice(0, 1);
    await submit(selected);
    expect(h.submitAbilityUse).toHaveBeenCalledWith(
      expect.objectContaining({
        userParticipantId: 'part-1',
        targets: selected,
        character: expect.objectContaining({ id: 'c1' }),
      }),
    );
    expect(useCombatStore.getState().hasUsedAction).toBe(true);
  });

  it('a Ação Bônus e a Reação marcam o espaço delas', async () => {
    h.getAbilitiesForCharacter.mockReturnValue([withEffect({ actionType: 'bonus_action' })]);
    startCombat(parts, 0);
    view();
    await useAbility('a1');
    await submit();
    expect(useCombatStore.getState().hasUsedBonusAction).toBe(true);
    expect(useCombatStore.getState().hasUsedAction).toBe(false);
  });

  it('se o serviço recusa, o espaço do turno não é marcado', async () => {
    h.submitAbilityUse.mockRejectedValue(new Error('Não é o turno'));
    startCombat(parts, 0);
    view();
    await useAbility('a1');
    await act(async () => {
      await (panel().onUse as (s: unknown[]) => Promise<unknown>)([]).catch(() => {});
    });
    expect(useCombatStore.getState().hasUsedAction).toBe(false);
  });

  describe('com TR', () => {
    const withSave = () =>
      withEffect({
        combatEffect: {
          targets: 'enemies',
          save: { attribute: 'sab' },
          apply: [{ conditionId: 'amedrontado', rounds: 10 }],
        },
      });
    const saveView = () => view(sheet({ attributes: { for: 16 } } as Partial<Character>));

    it('o Cartão mostra a CD da Habilidade do personagem (Guerreiro nível 3, FOR 16)', () => {
      h.getAbilitiesForCharacter.mockReturnValue([withSave()]);
      startCombat(parts, 0);
      saveView();
      openCard('a1');
      expect(card()).toHaveTextContent('CD 13');
    });

    it('o painel recebe a CD da Habilidade', async () => {
      h.getAbilitiesForCharacter.mockReturnValue([withSave()]);
      startCombat(parts, 0);
      saveView();
      await useAbility('a1');
      expect(panel().cd).toBe(13);
    });

    it('sem TR o painel não recebe CD', async () => {
      startCombat(parts, 0);
      view();
      await useAbility('a1');
      expect(panel().cd).toBeUndefined();
    });

    it('o serviço recebe a Vocação, o nível e os atributos para calcular a CD', async () => {
      h.getAbilitiesForCharacter.mockReturnValue([withSave()]);
      startCombat(parts, 0);
      saveView();
      await useAbility('a1');
      await submit();
      expect(h.submitAbilityUse).toHaveBeenCalledWith(
        expect.objectContaining({
          character: expect.objectContaining({
            vocation: 'Guerreiro',
            level: 3,
            attributes: { for: 16 },
          }),
        }),
      );
    });

    it('o painel recebe o uso gravado ao vivo, para mostrar o resultado do TR', async () => {
      h.getAbilitiesForCharacter.mockReturnValue([withSave()]);
      startCombat(parts, 0);
      saveView();
      await useAbility('a1');
      await submit();
      expect(panel().liveUse).toBeUndefined();
      await act(async () => {
        useCombatStore.setState({ abilityUses: [{ id: 'use-1', status: 'resolved' } as never] });
      });
      expect(panel().liveUse).toMatchObject({ id: 'use-1' });
    });
  });

  it('fechar o painel o tira da tela e devolve o Cartão à Habilidade', async () => {
    startCombat(parts, 0);
    view();
    await useAbility('a1');
    expect(document.querySelector('[data-stub="AbilityUsePanel"]')).not.toBeNull();
    await act(async () => {
      (panel().onClose as () => void)();
    });
    expect(document.querySelector('[data-stub="AbilityUsePanel"]')).toBeNull();
    expect(within(card()).getByRole('button', { name: 'Usar' })).toBeInTheDocument();
  });
});

describe('PlayerHotbar: os espaços do turno', () => {
  it('fora do combate, não há faixa de espaços', () => {
    view();
    expect(screen.queryByRole('group', { name: 'Espaços do turno' })).not.toBeInTheDocument();
  });

  it('no combate, a faixa tem Movimento, Ação Principal, Ação Bônus e Reação, e marca no armazém', () => {
    startCombat([participant()]);
    view();
    const strip = screen.getByRole('group', { name: 'Espaços do turno' });
    for (const [label, key] of [
      ['Movimento', 'hasUsedMovement'],
      ['Ação Principal', 'hasUsedAction'],
      ['Ação Bônus', 'hasUsedBonusAction'],
      ['Reação', 'hasUsedReaction'],
    ] as const) {
      fireEvent.click(within(strip).getByLabelText(label));
      expect(useCombatStore.getState()[key]).toBe(true);
      expect(within(strip).getByLabelText(label)).toBeChecked();
    }
  });

  it('a 0 PV (Morrendo), a faixa some', () => {
    startCombat([participant({ hp_current: 0 })]);
    view();
    expect(screen.queryByRole('group', { name: 'Espaços do turno' })).not.toBeInTheDocument();
  });
});

describe('PlayerHotbar: a aba Itens', () => {
  const owned = (id: string, quantity: number, items: Record<string, unknown>) => ({
    id,
    quantity,
    level: 1,
    items,
  });
  const BALSAMO = owned('ci1', 2, {
    slug: 'balsamo',
    name: 'Bálsamo de Gileade',
    description: 'Cura 2 PV. 1 dia de nutrição',
    is_consumable: true,
    effects: {},
  });
  const FLECHAS = owned('ci-fl', 12, { slug: 'flechas', name: 'Flecha', is_consumable: true });
  const ARCO = owned('ci-bow', 1, { slug: 'arco_curto', name: 'Arco Curto', is_consumable: false });
  const ESPADA = owned('ci-sw', 1, { slug: 'espada', name: 'Espada', is_consumable: false });
  const withItems = (items: unknown[], over: Partial<Character> = {}) =>
    sheet({ character_items: items, ...over } as Partial<Character>);
  const goToItems = () => fireEvent.click(screen.getByRole('tab', { name: /^Itens/ }));

  it('só os consumíveis que não são munição entram, com a quantidade', () => {
    view(withItems([BALSAMO, FLECHAS, ESPADA]));
    goToItems();
    expect(
      screen.getByRole('button', { name: 'Bálsamo de Gileade, 2 unidades' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Flecha/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Espada/ })).not.toBeInTheDocument();
  });

  it('sem consumíveis nem arma de munição, não há aba Itens', () => {
    view(withItems([ESPADA, FLECHAS]));
    expect(screen.queryByRole('tab', { name: /^Itens/ })).not.toBeInTheDocument();
  });

  it('com o arco na mão principal, a munição aparece como contador', () => {
    view(withItems([ARCO, FLECHAS], { equipment: { mainHand: 'ci-bow' } } as Partial<Character>));
    goToItems();
    expect(screen.getByText('Flecha: 12')).toBeInTheDocument();
  });

  it('o arco guardado na mochila não mostra o contador', () => {
    view(withItems([ARCO, FLECHAS]));
    expect(screen.queryByRole('tab', { name: /^Itens/ })).not.toBeInTheDocument();
  });

  it('usar o consumível gasta pelo caminho do Inventário, com a cura já resolvida', async () => {
    view(withItems([BALSAMO]));
    goToItems();
    fireEvent.click(screen.getByRole('button', { name: /^Bálsamo de Gileade/ }));
    await pressUse();
    expect(h.consumeInventoryItem).toHaveBeenCalledWith({
      characterId: 'c1',
      characterItemId: 'ci1',
      currentQuantity: 2,
      itemEffects: { heal: 2 },
      currentStats: sheet().stats,
      isPlayable: true,
    });
  });

  it('avisa a tela da quantidade nova e da cura aplicada', async () => {
    view(withItems([BALSAMO, ESPADA]));
    goToItems();
    fireEvent.click(screen.getByRole('button', { name: /^Bálsamo de Gileade/ }));
    await pressUse();
    expect(onCharacterPatch).toHaveBeenCalledWith({
      character_items: [{ ...BALSAMO, quantity: 1 }, ESPADA],
      stats: { ...sheet().stats, current_pv: 11 },
    });
  });

  it('a última unidade sai da lista', async () => {
    const last = { ...BALSAMO, quantity: 1 };
    view(withItems([last, ESPADA]));
    goToItems();
    fireEvent.click(screen.getByRole('button', { name: /^Bálsamo de Gileade/ }));
    await pressUse();
    expect(onCharacterPatch).toHaveBeenCalledWith(
      expect.objectContaining({ character_items: [ESPADA] }),
    );
  });

  it('um consumível sem efeito na ficha (Ração) só reduz a quantidade', async () => {
    const racao = owned('ci2', 3, {
      slug: 'racao',
      name: 'Ração de Viagem',
      description: 'Sustento: pão seco.',
      is_consumable: true,
    });
    view(withItems([racao]));
    goToItems();
    fireEvent.click(screen.getByRole('button', { name: /^Ração de Viagem/ }));
    await pressUse();
    expect(onCharacterPatch).toHaveBeenCalledWith({
      character_items: [{ ...racao, quantity: 2 }],
    });
  });

  it('o NPC jogável consome pela ficha de NPC', async () => {
    view(withItems([BALSAMO], { is_npc: true } as Partial<Character>));
    goToItems();
    fireEvent.click(screen.getByRole('button', { name: /^Bálsamo de Gileade/ }));
    await pressUse();
    expect(h.consumeInventoryItem).toHaveBeenCalledWith(
      expect.objectContaining({ isPlayable: false }),
    );
  });

  it('a falha ao consumir é registrada e a tela não é avisada', async () => {
    h.consumeInventoryItem.mockRejectedValueOnce(new Error('sem rede'));
    view(withItems([BALSAMO]));
    goToItems();
    fireEvent.click(screen.getByRole('button', { name: /^Bálsamo de Gileade/ }));
    await pressUse();
    expect(console.error).toHaveBeenCalledWith('Error using item:', expect.any(Error));
    expect(onCharacterPatch).not.toHaveBeenCalled();
  });

  it('o consumível vale dentro e fora do combate', () => {
    startCombat([participant()]);
    view(withItems([BALSAMO]));
    goToItems();
    fireEvent.click(screen.getByRole('button', { name: /^Bálsamo de Gileade/ }));
    expect(within(card()).getByRole('button', { name: 'Usar' })).toBeEnabled();
  });
});
