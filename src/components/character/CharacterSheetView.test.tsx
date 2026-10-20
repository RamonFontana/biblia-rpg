// CARACTERIZAÇÃO: fixa o que a ficha mostra e faz, com os dados e os filhos falsos (cada filho é um
// stub que desenha as props recebidas). Cobre a busca da ficha, os números do topo, as Habilidades,
// o equipamento e as atualizações em tempo real. Decisões: ROADMAP.md, Onda 4, passo 5c.
// Termos: CONTEXT.md (Ficha, Habilidade, Fé).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  getCharacterById: vi.fn(),
  findLatestCharacterOfUser: vi.fn(),
  findParticipantCharacterId: vi.fn(),
  getCharacterInventory: vi.fn(),
  subscribeToCharacterSheet: vi.fn(),
  updateCharacter: vi.fn(),
  updateCharacterEquipment: vi.fn(),
  updateItemLevel: vi.fn(),
  updateItemResistances: vi.fn(),
  updateWeaponEffects: vi.fn(),
  consume: vi.fn(),
  recover: vi.fn(),
  addCharges: vi.fn(),
  consumeItem: vi.fn(),
  removeItem: vi.fn(),
  isUpdating: false,
  unsubscribe: vi.fn(),
}));

vi.mock('@/data-access/characters', () => ({
  getCharacterById: h.getCharacterById,
  findLatestCharacterOfUser: h.findLatestCharacterOfUser,
  subscribeToCharacterSheet: h.subscribeToCharacterSheet,
  updateCharacter: h.updateCharacter,
  updateCharacterEquipment: h.updateCharacterEquipment,
}));
vi.mock('@/data-access/sessions', () => ({
  findParticipantCharacterId: h.findParticipantCharacterId,
}));
vi.mock('@/data-access/inventory', () => ({
  getCharacterInventory: h.getCharacterInventory,
  updateItemLevel: h.updateItemLevel,
  updateItemResistances: h.updateItemResistances,
  updateWeaponEffects: h.updateWeaponEffects,
}));
vi.mock('@/hooks/useAmmunition', () => ({
  useAmmunition: () => ({ consume: h.consume, recover: h.recover, addCharges: h.addCharges }),
}));
vi.mock('@/hooks/useUpdateNPCInventory', () => ({
  useUpdateNPCInventory: () => ({
    consumeItem: h.consumeItem,
    removeItem: h.removeItem,
    isUpdating: h.isUpdating,
  }),
}));

vi.mock('./NPCInventoryManager', async () => ({
  NPCInventoryManager: (await import('@/test/stubs')).makeStub('NPCInventoryManager'),
}));
vi.mock('../inventory/EquipmentSlots', async () => ({
  EquipmentSlots: (await import('@/test/stubs')).makeStub('EquipmentSlots'),
}));
vi.mock('../inventory/InventoryList', async () => ({
  InventoryList: (await import('@/test/stubs')).makeStub('InventoryList'),
}));
vi.mock('../combat/AbilityCard', async () => ({
  AbilityCard: (await import('@/test/stubs')).makeStub(
    'AbilityCard',
    (props) => (props.ability as { id: string }).id,
  ),
}));
vi.mock('../ui/CharacterAvatar', async () => ({
  CharacterAvatar: (await import('@/test/stubs')).makeStub('CharacterAvatar'),
}));
vi.mock('./CharacterSkillsList', async () => ({
  CharacterSkillsList: (await import('@/test/stubs')).makeStub('CharacterSkillsList'),
}));
vi.mock('./CharacterSavingThrows', async () => ({
  CharacterSavingThrows: (await import('@/test/stubs')).makeStub('CharacterSavingThrows'),
}));

import { clearStubs, stubProps } from '@/test/stubs';
import { CharacterSheetView } from './CharacterSheetView';

type Fn = (...args: unknown[]) => unknown;
type Obj = Record<string, unknown>;
const props = (name: string, instance?: string) => stubProps(name, instance);
const prop = (name: string, key: string): unknown => stubProps(name)?.[key];
const call = (name: string, key: string, ...args: unknown[]): unknown => {
  const fn = prop(name, key);
  if (typeof fn !== 'function') throw new Error(`${name}.${key} não é uma função`);
  return (fn as Fn)(...args);
};
/** Chama o callback de um cartão de Habilidade pelo id da Habilidade. */
const callCard = (abilityId: string, key: string, ...args: unknown[]): unknown => {
  const fn = stubProps('AbilityCard', abilityId)?.[key];
  if (typeof fn !== 'function') throw new Error(`AbilityCard ${abilityId}.${key} não é uma função`);
  return (fn as Fn)(...args);
};
const hasStub = (name: string) => !!document.querySelector(`[data-stub="${name}"]`);

const sacerdote = {
  imposicao: 'vocation-sacerdote-1-imposicao-de-ma', // 2 usos, custa 3 de Fé
  oracao: 'vocation-sacerdote-1-oracao-de-prote', // 1 uso, custa 5 de Fé
  guia: 'vocation-sacerdote-1-guia-espiritual', // 3 usos, custa 2 de Fé
  jejum: 'tribe-levi-1-jejum-do-desert', // sem limite
};

const character = (over: Obj = {}) => ({
  id: 'c1',
  user_id: 'u1',
  name: 'Calebe',
  tribe: 'Judá',
  vocation: 'Guerreiro',
  level: 1,
  coins: 12,
  attributes: { for: 16, des: 14, con: 12, int: 10, sab: 8, car: 9 },
  stats: { pv: 12, current_pv: 7, ca: 12, faith: 50, current_faith: 40 },
  equipment: { head: null, body: null, mainHand: null, offHand: null },
  narrative: {},
  proficiencies: { skill_proficiencies: ['atletismo'] },
  skills: {},
  is_npc: false,
  ...over,
});
const levi = (over: Obj = {}) => character({ tribe: 'Levi', vocation: 'Sacerdote', ...over });

let subscription: {
  onInventoryChange: () => Promise<void>;
  onCharacterUpdate: (row: Obj) => void;
};

const show = async (ui = <CharacterSheetView characterId="c1" />) => {
  render(ui);
  await waitFor(() => expect(screen.queryByText(/Consultando os pergaminhos/)).toBeNull());
  await act(async () => {});
};

beforeEach(() => {
  clearStubs();
  for (const fn of Object.values(h))
    if (typeof fn === 'function' && 'mockReset' in fn) fn.mockReset();
  h.isUpdating = false;
  h.getCharacterById.mockResolvedValue(character());
  h.findLatestCharacterOfUser.mockResolvedValue(null);
  h.findParticipantCharacterId.mockResolvedValue(null);
  h.getCharacterInventory.mockResolvedValue([]);
  h.updateCharacter.mockResolvedValue(undefined);
  h.updateCharacterEquipment.mockResolvedValue(undefined);
  h.updateItemLevel.mockResolvedValue(undefined);
  h.updateItemResistances.mockResolvedValue(undefined);
  h.updateWeaponEffects.mockResolvedValue(undefined);
  h.consume.mockResolvedValue(undefined);
  h.recover.mockResolvedValue(undefined);
  h.addCharges.mockResolvedValue(undefined);
  h.subscribeToCharacterSheet.mockImplementation((_id: string, handlers: typeof subscription) => {
    subscription = handlers;
    return h.unsubscribe;
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('buscar a ficha', () => {
  it('com characterId, busca essa ficha e o inventário', async () => {
    await show();
    expect(h.getCharacterById).toHaveBeenCalledWith('c1');
    expect(h.getCharacterInventory).toHaveBeenCalledWith('c1');
    expect(h.findParticipantCharacterId).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Calebe');
  });

  it('com sessão e usuário, usa a ficha que o usuário tem na sessão', async () => {
    h.findParticipantCharacterId.mockResolvedValue('c9');
    await show(<CharacterSheetView userId="u1" sessionId="s1" />);
    expect(h.findParticipantCharacterId).toHaveBeenCalledWith('s1', 'u1');
    expect(h.getCharacterById).toHaveBeenCalledWith('c9');
  });

  it('sem ficha na sessão, cai na ficha mais recente do usuário', async () => {
    h.findLatestCharacterOfUser.mockResolvedValue(character({ id: 'c7', name: 'Recente' }));
    await show(<CharacterSheetView userId="u1" sessionId="s1" />);
    expect(h.getCharacterById).not.toHaveBeenCalled();
    expect(h.findLatestCharacterOfUser).toHaveBeenCalledWith('u1');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Recente');
  });

  it('só com o usuário (sem sessão), usa a ficha mais recente', async () => {
    h.findLatestCharacterOfUser.mockResolvedValue(character());
    await show(<CharacterSheetView userId="u1" />);
    expect(h.findParticipantCharacterId).not.toHaveBeenCalled();
    expect(h.findLatestCharacterOfUser).toHaveBeenCalledWith('u1');
  });

  it('sem usuário nem ficha, não busca nada e fica carregando', async () => {
    render(<CharacterSheetView />);
    await act(async () => {});
    expect(screen.getByText('Consultando os pergaminhos antigos...')).toBeInTheDocument();
    expect(h.getCharacterById).not.toHaveBeenCalled();
  });

  it('ficha que não existe mostra o Pergaminho Vazio', async () => {
    h.getCharacterById.mockResolvedValue(null);
    await show();
    expect(screen.getByText('Pergaminho Vazio')).toBeInTheDocument();
    expect(screen.getByText('Personagem não encontrado para este jogador.')).toBeInTheDocument();
  });

  it('erro na busca mostra os detalhes; erro sem texto mostra o JSON', async () => {
    h.getCharacterById.mockRejectedValue(new Error('RLS negou'));
    await show();
    expect(
      screen.getByText('Ocorreu um erro ao carregar a ficha. Detalhes: RLS negou'),
    ).toBeInTheDocument();
    cleanup();
    h.getCharacterById.mockRejectedValue({ codigo: 7 });
    await show();
    expect(
      screen.getByText('Ocorreu um erro ao carregar a ficha. Detalhes: {"codigo":7}'),
    ).toBeInTheDocument();
  });

  it('falha no inventário é registrada e a ficha abre mesmo assim', async () => {
    h.getCharacterInventory.mockRejectedValue(new Error('sem inventário'));
    await show();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Calebe');
    expect(console.error).toHaveBeenCalledWith('Error fetching inventory:', expect.any(Error));
    expect(prop('InventoryList', 'inventoryItems')).toEqual([]);
  });
});

describe('o topo da ficha', () => {
  it('nome, tribo, vocação, proficiência e avatar', async () => {
    h.getCharacterById.mockResolvedValue(
      character({ level: 5, narrative: { imageUrl: 'http://img/a.png' } }),
    );
    await show();
    expect(screen.getByText('Tribo:')).toHaveTextContent('Judá');
    expect(screen.getByText('Vocação:')).toHaveTextContent('Guerreiro');
    expect(screen.getByText(/Proficiência:/)).toHaveTextContent('+3'); // nível 5
    expect(props('CharacterAvatar')).toMatchObject({
      imageUrl: 'http://img/a.png',
      name: 'Calebe',
    });
  });

  it('sem nome, tribo, vocação e nível: "Desconhecido", "Nenhuma" e +2', async () => {
    h.getCharacterById.mockResolvedValue(
      character({ name: '', tribe: '', vocation: '', level: undefined }),
    );
    await show();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Desconhecido');
    expect(screen.getByText('Tribo:')).toHaveTextContent('Nenhuma');
    expect(screen.getByText('Vocação:')).toHaveTextContent('Nenhuma');
    expect(screen.getByText(/Proficiência:/)).toHaveTextContent('+2');
    expect(prop('CharacterAvatar', 'name')).toBe('Desconhecido');
  });
});

describe('PV, CA, Fé e moedas', () => {
  it('mostra PV atual/máximo, a CA, a Fé atual e as moedas', async () => {
    await show();
    expect(screen.getByText('PV').parentElement).toHaveTextContent('7/12');
    expect(screen.getByText('CA').parentElement).toHaveTextContent('12');
    expect(screen.getByText('Fé').parentElement).toHaveTextContent('40/100');
    expect(screen.getByText('SP').parentElement).toHaveTextContent('12');
  });

  it('sem PV gravado usa 10; sem moedas mostra 0; Fé cai na inicial', async () => {
    h.getCharacterById.mockResolvedValue(character({ stats: { faith: 50 }, coins: undefined }));
    await show();
    expect(screen.getByText('PV').parentElement).toHaveTextContent('10/10');
    expect(screen.getByText('Fé').parentElement).toHaveTextContent('50/100');
    expect(screen.getByText('SP').parentElement).toHaveTextContent('0');
  });

  it('armadura equipada soma à CA e mostra o bônus com a conta no título', async () => {
    h.getCharacterById.mockResolvedValue(
      character({ equipment: { head: null, body: 'ci-armor', mainHand: null, offHand: null } }),
    );
    h.getCharacterInventory.mockResolvedValue([
      { id: 'ci-armor', quantity: 1, item_id: 'x', items: { slug: 'couro_cru', effects: {} } },
    ]);
    await show();
    const bonus = screen.getByTitle(/Base \d+ \+ Bônus \d+/);
    expect(bonus).toHaveTextContent(/^\(\+\d+\)$/);
    expect(screen.getByText('CA').parentElement).toHaveTextContent(/\d+\(\+\d+\)CA/);
  });

  it('sem armadura, não há bônus nem selo de Resistência', async () => {
    await show();
    expect(screen.queryByTitle(/Base \d+ \+ Bônus/)).toBeNull();
    expect(screen.queryByText('Resistência')).toBeNull();
  });
});

describe('atributos e perícias', () => {
  it('cada atributo mostra o modificador e o valor; sem valor, o modificador de 10', async () => {
    h.getCharacterById.mockResolvedValue(
      character({ attributes: { for: 16, des: 14, con: 12, int: 10, sab: 8 } }),
    );
    await show();
    const cell = (label: string) => screen.getByText(label).parentElement!;
    expect(cell('FOR')).toHaveTextContent('+316');
    expect(cell('DES')).toHaveTextContent('+214');
    expect(cell('SAB')).toHaveTextContent('-18');
    expect(cell('CAR')).toHaveTextContent('+010');
  });

  it('entrega aos filhos o nível, a vocação e as perícias treinadas', async () => {
    await show();
    expect(props('CharacterSavingThrows')).toMatchObject({ level: 1, vocation: 'Guerreiro' });
    expect(props('CharacterSkillsList')).toMatchObject({
      level: 1,
      proficiencies: ['atletismo'],
    });
  });

  it('sem nível, vocação ou perícias: nível 1, vocação vazia e lista vazia', async () => {
    h.getCharacterById.mockResolvedValue(
      character({ level: undefined, vocation: '', proficiencies: undefined }),
    );
    await show();
    expect(props('CharacterSavingThrows')).toMatchObject({ level: 1, vocation: '' });
    expect(prop('CharacterSkillsList', 'proficiencies')).toEqual([]);
  });
});

describe('características (narrativa)', () => {
  it('só aparece com aparência, personalidade ou história, e cada bloco só se houver texto', async () => {
    await show();
    expect(screen.queryByText('Características')).toBeNull();
    cleanup();
    h.getCharacterById.mockResolvedValue(
      character({ narrative: { physicalDesc: 'Alto', history: 'Pastor' } }),
    );
    await show();
    expect(screen.getByText('Características')).toBeInTheDocument();
    expect(screen.getByText('Aparência')).toBeInTheDocument();
    expect(screen.getByText('Alto')).toBeInTheDocument();
    expect(screen.getByText('História')).toBeInTheDocument();
    expect(screen.queryByText('Personalidade')).toBeNull();
  });
});

describe('Habilidades', () => {
  const cards = () => Array.from(document.querySelectorAll('[data-stub="AbilityCard"]'));

  it('lista as Habilidades da tribo e da vocação no nível', async () => {
    h.getCharacterById.mockResolvedValue(levi());
    await show();
    expect(screen.getByText('Habilidades')).toBeInTheDocument();
    expect(cards()).toHaveLength(5);
  });

  it('não aparece para ficha de inimigo (skills em lista) nem quando não há Habilidade', async () => {
    h.getCharacterById.mockResolvedValue(
      levi({ skills: [{ name: 'Golpe', description: 'forte' }] }),
    );
    await show();
    expect(screen.queryByText('Habilidades')).toBeNull();
    cleanup();
    h.getCharacterById.mockResolvedValue(character({ tribe: 'Inexistente', vocation: 'Nobre' }));
    await show();
    expect(screen.queryByText('Habilidades')).toBeNull();
  });

  it('lista vazia de skills conta como ficha comum e mostra as Habilidades', async () => {
    h.getCharacterById.mockResolvedValue(levi({ skills: [] }));
    await show();
    expect(screen.getByText('Habilidades')).toBeInTheDocument();
  });

  const cardFor = (id: string) =>
    cards().find((c) => c.textContent?.includes(`"id":"${id}"`))! as HTMLElement;
  const cardJson = (id: string) => JSON.parse(cardFor(id).textContent!);

  it('mostra os usos que restam e desliga a Habilidade sem usos ou sem Fé (para o jogador)', async () => {
    h.getCharacterById.mockResolvedValue(
      levi({
        stats: { pv: 10, faith: 50, current_faith: 4 },
        skills: { ability_uses: { [sacerdote.guia]: 3, [sacerdote.imposicao]: 1 } },
      }),
    );
    await show();
    // Imposição: 2 usos, 1 gasto, custa 3 de Fé (tem 4): 1 uso restante, liberada.
    expect(cardJson(sacerdote.imposicao)).toMatchObject({ currentUses: 1, disabled: false });
    // Oração: custa 5 de Fé e só há 4.
    expect(cardJson(sacerdote.oracao)).toMatchObject({
      currentUses: 1,
      disabled: true,
      disabledReason: 'Fé Insuficiente',
    });
    // Guia: 3 usos gastos, Fé suficiente (custa 2).
    expect(cardJson(sacerdote.guia)).toMatchObject({
      currentUses: 0,
      disabled: true,
      disabledReason: 'Sem Usos',
    });
    // Sem limite de usos nem custo: sem contagem, sempre liberada.
    const jejum = cardJson(sacerdote.jejum);
    expect(jejum.currentUses).toBeUndefined();
    expect(jejum.disabled).toBe(false);
  });

  it('o Mestre vê tudo liberado, sem motivo', async () => {
    h.getCharacterById.mockResolvedValue(
      levi({
        stats: { pv: 10, faith: 50, current_faith: 1 },
        skills: { ability_uses: { [sacerdote.guia]: 3 } },
      }),
    );
    await show(<CharacterSheetView characterId="c1" isGM />);
    expect(cardJson(sacerdote.guia)).toMatchObject({ disabled: false, isGM: true });
    expect(cardJson(sacerdote.oracao)).toMatchObject({ disabled: false });
  });

  it('usar gasta um uso e a Fé, e grava as duas coisas', async () => {
    h.getCharacterById.mockResolvedValue(levi());
    await show();
    await act(async () => {
      await callCard(sacerdote.imposicao, 'onUse');
    });
    expect(h.updateCharacter).toHaveBeenCalledWith('c1', {
      skills: { ability_uses: { [sacerdote.imposicao]: 1 } },
      stats: { pv: 12, current_pv: 7, ca: 12, faith: 50, current_faith: 37 },
    });
  });

  it('usar de novo soma ao que já foi gasto e mantém o resto das skills', async () => {
    h.getCharacterById.mockResolvedValue(
      levi({
        skills: {
          path_choices: { tribe: 'A' },
          ability_uses: { [sacerdote.imposicao]: 1, [sacerdote.guia]: 2 },
        },
      }),
    );
    await show();
    await act(async () => {
      await callCard(sacerdote.imposicao, 'onUse');
    });
    expect(h.updateCharacter.mock.calls[0][1]).toMatchObject({
      skills: {
        path_choices: { tribe: 'A' },
        ability_uses: { [sacerdote.imposicao]: 2, [sacerdote.guia]: 2 },
      },
    });
  });

  it('Habilidade sem custo de Fé não mexe nos stats', async () => {
    h.getCharacterById.mockResolvedValue(levi());
    await show();
    await act(async () => {
      await callCard(sacerdote.jejum, 'onUse');
    });
    const [, updates] = h.updateCharacter.mock.calls[0];
    expect(updates).toStrictEqual({ skills: { ability_uses: { [sacerdote.jejum]: 1 } } });
  });

  it('sem Fé para o custo, não grava nada', async () => {
    h.getCharacterById.mockResolvedValue(levi({ stats: { pv: 10, faith: 50, current_faith: 2 } }));
    await show();
    await act(async () => {
      await callCard(sacerdote.oracao, 'onUse');
    });
    expect(h.updateCharacter).not.toHaveBeenCalled();
  });

  it('enquanto o inventário está atualizando, usar não faz nada', async () => {
    h.isUpdating = true;
    h.getCharacterById.mockResolvedValue(levi());
    await show();
    await act(async () => {
      await callCard(sacerdote.jejum, 'onUse');
    });
    expect(h.updateCharacter).not.toHaveBeenCalled();
  });

  it('erro ao gravar o uso é só registrado', async () => {
    h.updateCharacter.mockRejectedValue(new Error('falhou'));
    h.getCharacterById.mockResolvedValue(levi());
    await show();
    await act(async () => {
      await callCard(sacerdote.jejum, 'onUse');
    });
    expect(console.error).toHaveBeenCalledWith('Failed to use ability:', expect.any(Error));
  });

  it('restaurar apaga o registro de usos da Habilidade, só para o Mestre', async () => {
    h.getCharacterById.mockResolvedValue(
      levi({
        skills: {
          path_choices: { tribe: 'A' },
          ability_uses: { [sacerdote.imposicao]: 2, [sacerdote.guia]: 1 },
        },
      }),
    );
    await show();
    await act(async () => {
      await callCard(sacerdote.imposicao, 'onRestore');
    });
    expect(h.updateCharacter).not.toHaveBeenCalled();
    cleanup();
    await show(<CharacterSheetView characterId="c1" isGM />);
    await act(async () => {
      await callCard(sacerdote.imposicao, 'onRestore');
    });
    expect(h.updateCharacter).toHaveBeenCalledWith('c1', {
      skills: { path_choices: { tribe: 'A' }, ability_uses: { [sacerdote.guia]: 1 } },
    });
  });

  it('restaurar não faz nada com o inventário atualizando, e o erro é registrado', async () => {
    h.getCharacterById.mockResolvedValue(levi());
    h.isUpdating = true;
    await show(<CharacterSheetView characterId="c1" isGM />);
    await act(async () => {
      await callCard(sacerdote.jejum, 'onRestore');
    });
    expect(h.updateCharacter).not.toHaveBeenCalled();
    cleanup();
    h.isUpdating = false;
    h.updateCharacter.mockRejectedValue(new Error('falhou'));
    await show(<CharacterSheetView characterId="c1" isGM />);
    await act(async () => {
      await callCard(sacerdote.jejum, 'onRestore');
    });
    expect(console.error).toHaveBeenCalledWith('Failed to restore ability:', expect.any(Error));
  });
});

describe('equipamento e inventário', () => {
  const armor = {
    id: 'ci-armor',
    quantity: 1,
    item_id: 'x',
    items: { slug: 'couro_cru', effects: { slot: 'body' } },
  };

  it('entrega aos filhos o equipamento, a Vocação, a Força e o inventário', async () => {
    h.getCharacterInventory.mockResolvedValue([armor]);
    await show();
    expect(props('EquipmentSlots')).toMatchObject({
      equipment: { head: null, body: null, mainHand: null, offHand: null },
      characterVocation: 'Guerreiro',
      characterStrength: 16,
      inventoryItems: [armor],
    });
    expect(props('InventoryList')).toMatchObject({
      vocation: 'Guerreiro',
      strength: 16,
      isUpdating: false,
      inventoryItems: [armor],
    });
  });

  it('sem equipamento gravado ou sem Força, usa os espaços vazios e Força nula', async () => {
    h.getCharacterById.mockResolvedValue(
      character({ equipment: undefined, attributes: { des: 10 } }),
    );
    await show();
    expect(prop('EquipmentSlots', 'equipment')).toEqual({
      head: null,
      body: null,
      mainHand: null,
      offHand: null,
    });
    expect(prop('EquipmentSlots', 'characterStrength')).toBeNull();
    expect(prop('InventoryList', 'strength')).toBeNull();
  });

  it('equipar grava o novo equipamento e atualiza a tela na hora', async () => {
    await show();
    await act(async () => {
      await call('InventoryList', 'onEquip', 'ci-armor', { slot: 'body' });
    });
    expect(h.updateCharacterEquipment).toHaveBeenCalledWith('c1', {
      head: null,
      body: 'ci-armor',
      mainHand: null,
      offHand: null,
    });
    expect(prop('EquipmentSlots', 'equipment')).toMatchObject({ body: 'ci-armor' });
  });

  it('desequipar esvazia o espaço, grava e atualiza a tela', async () => {
    h.getCharacterById.mockResolvedValue(
      character({ equipment: { head: null, body: 'ci-armor', mainHand: null, offHand: null } }),
    );
    await show();
    await act(async () => {
      await call('EquipmentSlots', 'onUnequip', 'body');
    });
    expect(h.updateCharacterEquipment).toHaveBeenCalledWith('c1', {
      head: null,
      body: null,
      mainHand: null,
      offHand: null,
    });
    expect(prop('EquipmentSlots', 'equipment')).toMatchObject({ body: null });
  });

  it('erro ao equipar ou desequipar é registrado e a tela fica como estava', async () => {
    h.updateCharacterEquipment.mockRejectedValue(new Error('falhou'));
    await show();
    await act(async () => {
      await call('InventoryList', 'onEquip', 'ci-armor', { slot: 'body' });
      await call('EquipmentSlots', 'onUnequip', 'body');
    });
    expect(console.error).toHaveBeenCalledWith('Error equipping item:', expect.any(Error));
    expect(console.error).toHaveBeenCalledWith('Error unequipping item:', expect.any(Error));
    expect(prop('EquipmentSlots', 'equipment')).toMatchObject({ body: null });
  });

  it('enquanto uma ação do inventário roda, a lista fica ocupada', async () => {
    let finish: () => void = () => {};
    h.updateItemLevel.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    await show();
    act(() => {
      void call('InventoryList', 'onChangeLevel', 'ci1', 3);
    });
    expect(prop('InventoryList', 'isUpdating')).toBe(true);
    await act(async () => {
      finish();
    });
    expect(prop('InventoryList', 'isUpdating')).toBe(false);
  });

  it('o inventário em atualização também deixa a lista ocupada', async () => {
    h.isUpdating = true;
    await show();
    expect(prop('InventoryList', 'isUpdating')).toBe(true);
  });

  it('nível, resistências e efeitos de arma vão para a camada de dados', async () => {
    await show();
    await act(async () => {
      await call('InventoryList', 'onChangeLevel', 'ci1', 3);
      await call('InventoryList', 'onChangeResistances', 'ci1', ['sangrando']);
      await call('InventoryList', 'onChangeWeaponEffects', 'ci1', [
        { conditionId: 'cego', trigger: 'natural_18_plus' },
      ]);
    });
    expect(h.updateItemLevel).toHaveBeenCalledWith('ci1', 3);
    expect(h.updateItemResistances).toHaveBeenCalledWith('ci1', ['sangrando']);
    expect(h.updateWeaponEffects).toHaveBeenCalledWith('ci1', [
      { conditionId: 'cego', trigger: 'natural_18_plus' },
    ]);
  });

  it('erros de nível, resistências e efeitos são registrados com a mensagem de cada um', async () => {
    h.updateItemLevel.mockRejectedValue(new Error('a'));
    h.updateItemResistances.mockRejectedValue(new Error('b'));
    h.updateWeaponEffects.mockRejectedValue(new Error('c'));
    await show();
    await act(async () => {
      await call('InventoryList', 'onChangeLevel', 'ci1', 3);
      await call('InventoryList', 'onChangeResistances', 'ci1', []);
      await call('InventoryList', 'onChangeWeaponEffects', 'ci1', []);
    });
    expect(console.error).toHaveBeenCalledWith('Error updating item level:', expect.any(Error));
    expect(console.error).toHaveBeenCalledWith(
      'Error updating item resistances:',
      expect.any(Error),
    );
    expect(console.error).toHaveBeenCalledWith('Error updating weapon effects:', expect.any(Error));
  });

  it('munição: consumir gasta 1, recuperar e repor usam o gancho, só o Mestre repõe', async () => {
    await show();
    await act(async () => {
      await call('InventoryList', 'onConsumeAmmunition', 'ci1');
      await call('InventoryList', 'onRecoverAmmunition', 'ci1', 4, 20);
    });
    expect(h.consume).toHaveBeenCalledWith('ci1', 1);
    expect(h.recover).toHaveBeenCalledWith('ci1', 4, 20);
    expect(prop('InventoryList', 'onAddCharges')).toBeUndefined();
    cleanup();
    await show(<CharacterSheetView characterId="c1" isGM />);
    await act(async () => {
      await call('InventoryList', 'onAddCharges', 'ci1', 5);
    });
    expect(h.addCharges).toHaveBeenCalledWith('ci1', 5);
  });

  it('erros de munição são registrados', async () => {
    h.consume.mockRejectedValue(new Error('a'));
    h.recover.mockRejectedValue(new Error('b'));
    h.addCharges.mockRejectedValue(new Error('c'));
    await show(<CharacterSheetView characterId="c1" isGM />);
    await act(async () => {
      await call('InventoryList', 'onConsumeAmmunition', 'ci1');
      await call('InventoryList', 'onRecoverAmmunition', 'ci1', 1, 2);
      await call('InventoryList', 'onAddCharges', 'ci1', 1);
    });
    expect(console.error).toHaveBeenCalledWith('Error consuming ammunition:', expect.any(Error));
    expect(console.error).toHaveBeenCalledWith('Error recovering ammunition:', expect.any(Error));
    expect(console.error).toHaveBeenCalledWith('Error adding charges:', expect.any(Error));
  });

  it('usar consumível passa o item, os stats e se o personagem é jogável', async () => {
    await show();
    call('InventoryList', 'onUseConsumable', {
      id: 'ci1',
      quantity: 3,
      items: { effects: { heal: 4 } },
    });
    expect(h.consumeItem).toHaveBeenCalledWith(
      'c1',
      'ci1',
      3,
      { heal: 4 },
      { pv: 12, current_pv: 7, ca: 12, faith: 50, current_faith: 40 },
      true,
    );
    cleanup();
    h.getCharacterById.mockResolvedValue(character({ is_npc: true, stats: undefined }));
    await show();
    call('InventoryList', 'onUseConsumable', { id: 'ci1', quantity: 1, items: { effects: {} } });
    expect(h.consumeItem).toHaveBeenLastCalledWith('c1', 'ci1', 1, {}, {}, false);
  });

  it('remover item usa o gancho do inventário', async () => {
    await show();
    expect(prop('InventoryList', 'onRemoveItem')).toBe(h.removeItem);
  });

  it('o gerenciador de inventário de NPC só aparece para o Mestre', async () => {
    h.getCharacterInventory.mockResolvedValue([armor]);
    await show();
    expect(hasStub('NPCInventoryManager')).toBe(false);
    cleanup();
    await show(<CharacterSheetView characterId="c1" isGM />);
    expect(props('NPCInventoryManager')).toMatchObject({ characterId: 'c1', items: [armor] });
  });
});

describe('tempo real', () => {
  it('assina a ficha pelo id e cancela ao sair', async () => {
    const { unmount } = render(<CharacterSheetView characterId="c1" />);
    await waitFor(() => expect(h.subscribeToCharacterSheet).toHaveBeenCalled());
    expect(h.subscribeToCharacterSheet.mock.calls[0][0]).toBe('c1');
    unmount();
    expect(h.unsubscribe).toHaveBeenCalled();
  });

  it('uma mudança no inventário relê o inventário; se falhar, mantém o que está na tela', async () => {
    h.getCharacterInventory.mockResolvedValueOnce([{ id: 'a' }]);
    await show();
    h.getCharacterInventory.mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }]);
    await act(async () => {
      await subscription.onInventoryChange();
    });
    expect(prop('InventoryList', 'inventoryItems')).toEqual([{ id: 'a' }, { id: 'b' }]);
    h.getCharacterInventory.mockRejectedValueOnce(new Error('falhou'));
    await act(async () => {
      await subscription.onInventoryChange();
    });
    expect(prop('InventoryList', 'inventoryItems')).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(console.error).toHaveBeenCalledWith('Error fetching inventory:', expect.any(Error));
  });

  it('uma atualização da ficha mistura a linha nova na ficha da tela', async () => {
    await show();
    act(() => subscription.onCharacterUpdate({ name: 'Calebe, o Fiel', coins: 99 }));
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Calebe, o Fiel');
    expect(screen.getByText('SP').parentElement).toHaveTextContent('99');
    expect(screen.getByText('Vocação:')).toHaveTextContent('Guerreiro');
  });
});
