// CARACTERIZAÇÃO: a visão de combate do jogador: o cabeçalho, o turno, o painel de Teste de Morte,
// o checklist e as Habilidades (quando ficam bloqueadas e o que usar uma grava). As Habilidades são
// falsas para o teste não depender do conteúdo. Decisões: ROADMAP.md, Onda 4, passo 7f.
// Termos: CONTEXT.md (Habilidade, Fé, Morrendo).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
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
vi.mock('../../utils/abilityUtils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/abilityUtils')>()),
  getAbilitiesForCharacter: h.getAbilitiesForCharacter,
}));
vi.mock('./EnemyCombatList', async () => ({
  EnemyCombatList: (await import('@/test/stubs')).makeStub('EnemyCombatList'),
}));
vi.mock('./DeathSavesModal', async () => ({
  DeathSavesModal: (await import('@/test/stubs')).makeStub('DeathSavesModal'),
}));
vi.mock('./AbilityCard', async () => ({
  AbilityCard: (await import('@/test/stubs')).makeStub('AbilityCard', (props) =>
    String((props.ability as { id: string }).id),
  ),
}));

import { clearStubs, stubProps } from '@/test/stubs';
import { useCombatStore, type CombatParticipant } from '@/store/combatStore';
import type { AbilityDefinition } from '@/content/schemas';
import type { Character } from '@/features/character-management/types';
import { PlayerCombatView } from './PlayerCombatView';

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

const view = (character: Character | null = sheet()) =>
  render(<PlayerCombatView character={character} enemies={[]} isLoading={false} />);

const useAbility = (id: string) =>
  act(async () => {
    await (stubProps('AbilityCard', id)!.onUse as () => Promise<void>)();
  });

beforeEach(() => {
  h.updateCharacter.mockResolvedValue(undefined);
  h.getAbilitiesForCharacter.mockReturnValue([ability('a1')]);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  clearStubs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  useCombatStore.setState({ activeCombat: null, participants: [], currentTurnParticipant: null });
});

describe('PlayerCombatView: cabeçalho', () => {
  it('mostra o nome, a tribo e a vocação', () => {
    view();
    expect(screen.getByRole('heading', { name: 'Eliab' })).toBeInTheDocument();
    expect(screen.getByText('Judá')).toBeInTheDocument();
    expect(screen.getByText('• Guerreiro')).toBeInTheDocument();
  });

  it('sem personagem não há cabeçalho nem Habilidades', () => {
    view(null);
    expect(screen.queryByRole('heading', { name: 'Eliab' })).toBeNull();
    expect(screen.getByText('Nenhuma habilidade disponível.')).toBeInTheDocument();
  });
});

describe('PlayerCombatView: Habilidades do personagem', () => {
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

  it('o nível que chega como texto vale como número', () => {
    view(sheet({ level: '4' as never }));
    expect(h.getAbilitiesForCharacter).toHaveBeenCalledWith('Judá', 'Guerreiro', 4, undefined);
  });
});

describe('PlayerCombatView: Habilidade bloqueada ou livre', () => {
  it('fora do combate, a Habilidade de combate fica bloqueada', () => {
    h.getAbilitiesForCharacter.mockReturnValue([
      ability('a1', { usageType: 'combat' }),
      ability('a2'),
    ]);
    view();
    expect(stubProps('AbilityCard', 'a1')).toMatchObject({
      disabled: true,
      disabledReason: 'Apenas em combate',
    });
    expect(stubProps('AbilityCard', 'a2')).toMatchObject({ disabled: false, disabledReason: '' });
  });

  it('em combate, a Habilidade de combate fica livre', () => {
    h.getAbilitiesForCharacter.mockReturnValue([ability('a1', { usageType: 'combat' })]);
    startCombat([participant()]);
    view();
    expect(stubProps('AbilityCard', 'a1')).toMatchObject({ disabled: false });
  });

  it('sem Fé suficiente, bloqueia com o motivo', () => {
    h.getAbilitiesForCharacter.mockReturnValue([ability('a1', { faithCost: 50 })]);
    view();
    expect(stubProps('AbilityCard', 'a1')).toMatchObject({
      disabled: true,
      disabledReason: 'Fé Insuficiente',
    });
  });

  it('com Fé suficiente, fica livre', () => {
    h.getAbilitiesForCharacter.mockReturnValue([ability('a1', { faithCost: 10 })]);
    view();
    expect(stubProps('AbilityCard', 'a1')).toMatchObject({ disabled: false });
  });

  it('mostra os usos que restam e bloqueia sem usos', () => {
    h.getAbilitiesForCharacter.mockReturnValue([
      ability('a1', { maxUses: 2 }),
      ability('a2', { maxUses: 1 }),
      ability('a3'),
    ]);
    view(sheet({ skills: { ability_uses: { a1: 1, a2: 1 } } }));
    expect(stubProps('AbilityCard', 'a1')).toMatchObject({ currentUses: 1, disabled: false });
    expect(stubProps('AbilityCard', 'a2')).toMatchObject({
      currentUses: 0,
      disabled: true,
      disabledReason: 'Sem Usos',
    });
    expect(stubProps('AbilityCard', 'a3')!.currentUses).toBeUndefined();
  });
});

describe('PlayerCombatView: usar uma Habilidade', () => {
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

  it('sem Fé suficiente, não grava nada', async () => {
    h.getAbilitiesForCharacter.mockReturnValue([ability('a1', { faithCost: 90 })]);
    view();
    await useAbility('a1');
    expect(h.updateCharacter).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('a falha ao gravar é registrada e o botão volta a liberar', async () => {
    h.updateCharacter.mockRejectedValueOnce(new Error('sem rede'));
    view();
    await useAbility('a1');
    expect(console.error).toHaveBeenCalledWith('Failed to use ability:', expect.any(Error));
    await waitFor(() => expect(stubProps('AbilityCard', 'a1')).toMatchObject({ disabled: false }));
  });

  it('enquanto grava, todas as Habilidades ficam bloqueadas', async () => {
    let resolve: () => void = () => {};
    h.updateCharacter.mockReturnValueOnce(new Promise<void>((r) => (resolve = r)));
    view();
    act(() => {
      void (stubProps('AbilityCard', 'a1')!.onUse as () => Promise<void>)();
    });
    await waitFor(() => expect(stubProps('AbilityCard', 'a1')).toMatchObject({ disabled: true }));
    await act(async () => resolve());
  });
});

// O dano e a cura do Mestre vão para o participante; a ficha só recebe o PV no fim do combate.
// Durante o combate o jogador vê o PV do participante, e não o da ficha (o de antes do combate).
describe('PlayerCombatView: o PV em combate', () => {
  it('mostra o PV do participante sobre o PV máximo da ficha', () => {
    startCombat([participant({ hp_current: 4 })]);
    view();
    expect(screen.getByText('PV em combate')).toBeInTheDocument();
    expect(screen.getByText('4/12')).toBeInTheDocument();
  });

  it('não usa o PV que a ficha ainda guarda de antes do combate', () => {
    startCombat([participant({ hp_current: 4 })]);
    view(sheet({ stats: { pv: 12, current_pv: 12, ca: 11, faith: 50 } }));
    expect(screen.getByText('4/12')).toBeInTheDocument();
    expect(screen.queryByText('12/12')).toBeNull();
  });

  it('acompanha a cura e o dano que chegam pelo tempo real', () => {
    startCombat([participant({ hp_current: 4 })]);
    view();
    act(() => startCombat([participant({ hp_current: 9 })]));
    expect(screen.getByText('9/12')).toBeInTheDocument();
  });

  it('a 0 PV mostra 0/12 junto do Teste de Morte', () => {
    startCombat([participant({ hp_current: 0 })]);
    view();
    expect(screen.getByText('0/12')).toBeInTheDocument();
  });

  it('sem combate, não mostra o PV em combate', () => {
    view();
    expect(screen.queryByText('PV em combate')).toBeNull();
  });

  it('em combate mas fora da lista de participantes, não mostra o PV em combate', () => {
    startCombat([participant({ entity_id: 'outro' })]);
    view();
    expect(screen.queryByText('PV em combate')).toBeNull();
  });
});

describe('PlayerCombatView: o combate', () => {
  it('sem combate, não há lista de inimigos, turno nem checklist', () => {
    view();
    expect(document.querySelector('[data-stub="EnemyCombatList"]')).toBeNull();
    expect(screen.queryByText('Checklist de Ações (Sua Referência)')).toBeNull();
  });

  it('em combate mostra os inimigos e o checklist', () => {
    startCombat([participant()]);
    view();
    expect(stubProps('EnemyCombatList')).toMatchObject({ enemies: [], isLoading: false });
    expect(screen.getByText('Checklist de Ações (Sua Referência)')).toBeInTheDocument();
  });

  it('no turno do jogador, avisa', () => {
    startCombat([participant()]);
    view();
    expect(screen.getByText('É O SEU TURNO!')).toBeInTheDocument();
  });

  it('no turno de outro, não avisa', () => {
    startCombat([participant({ id: 'p2', entity_id: 'outro' }), participant()], 0);
    view();
    expect(screen.queryByText('É O SEU TURNO!')).toBeNull();
  });

  it('com PV 0 no combate, mostra o Teste de Morte e esconde o turno e o checklist', () => {
    startCombat([participant({ hp_current: 0 })]);
    view();
    expect(stubProps('DeathSavesModal')).toMatchObject({
      character: { id: 'c1' },
      participantId: 'part-1',
    });
    expect(screen.queryByText('É O SEU TURNO!')).toBeNull();
    expect(screen.queryByText('Checklist de Ações (Sua Referência)')).toBeNull();
  });
});
