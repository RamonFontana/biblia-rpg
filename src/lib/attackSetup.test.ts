// O que a tela de ataque lê do combate e da ficha: a arma da mão principal (do conteúdo, pelo slug
// do item) e os alvos possíveis (os outros participantes do combate, com nome e CA).
import { describe, expect, it } from 'vitest';
import { buildAttackTargets, resolveMainHandWeapon } from './attackSetup';

const item = (id: string, slug: string | null, asList = false) => {
  const catalog = { slug, name: slug ?? 'x' };
  return { id, items: asList ? [catalog] : catalog };
};

describe('resolveMainHandWeapon', () => {
  it('acha a arma da mão principal e traz os dados do conteúdo', () => {
    const found = resolveMainHandWeapon({
      equipment: { head: null, body: null, mainHand: 'ci-1', offHand: null },
      character_items: [item('ci-0', 'adaga'), item('ci-1', 'espada_longa')],
    });
    expect(found).toMatchObject({
      name: 'Espada Longa / Khopesh',
      weapon: { id: 'espada_longa', damage: '1d8 cortante', category: 'Marcial' },
    });
    expect(found?.weapon.properties).toContain('versatile');
  });

  it('lê o item aninhado como lista (o inventário às vezes chega assim)', () => {
    const found = resolveMainHandWeapon({
      equipment: { head: null, body: null, mainHand: 'ci-1', offHand: null },
      character_items: [item('ci-1', 'adaga', true)],
    });
    expect(found?.weapon.id).toBe('adaga');
  });

  it('sem nada na mão principal, é desarmado', () => {
    expect(
      resolveMainHandWeapon({
        equipment: { head: null, body: null, mainHand: null, offHand: null },
        character_items: [item('ci-1', 'adaga')],
      }),
    ).toBeNull();
  });

  it('a ficha antiga, com a lista de compras no lugar do equipamento, é desarmada', () => {
    expect(
      resolveMainHandWeapon({ equipment: [] as never, character_items: [item('ci-1', 'adaga')] }),
    ).toBeNull();
  });

  it('o que está na mão e não é arma (um escudo) não ataca', () => {
    expect(
      resolveMainHandWeapon({
        equipment: { head: null, body: null, mainHand: 'ci-1', offHand: null },
        character_items: [item('ci-1', 'escudo')],
      }),
    ).toBeNull();
  });

  it('o item que não está no inventário ou sem slug conhecido é desarmado', () => {
    const equipment = { head: null, body: null, mainHand: 'ci-9', offHand: null };
    expect(resolveMainHandWeapon({ equipment, character_items: [] })).toBeNull();
    expect(
      resolveMainHandWeapon({
        equipment: { ...equipment, mainHand: 'ci-1' },
        character_items: [item('ci-1', 'inexistente')],
      }),
    ).toBeNull();
  });
});

describe('buildAttackTargets', () => {
  const entities = [
    { id: 'c1', name: 'Eliabe', totalAc: 14 },
    { id: 'c2', name: 'Rute', totalAc: 12 },
    { id: 'e1', name: 'Filisteu', totalAc: 15 },
  ];
  const participants = [
    { id: 'p1', entity_id: 'c1', conditions: [] },
    { id: 'p2', entity_id: 'c2', conditions: [{ conditionId: 'caido', duration: null }] },
    { id: 'p3', entity_id: 'e1', conditions: [{ conditionId: 'cego', duration: 2 }] },
    { id: 'p4', entity_id: 'sem-ficha', conditions: [] },
  ];

  it('lista todos os participantes menos o próprio atacante, com nome e CA', () => {
    expect(buildAttackTargets(participants, 'p1', entities)).toEqual([
      { participantId: 'p2', name: 'Rute', ac: 12, conditionIds: ['caido'] },
      { participantId: 'p3', name: 'Filisteu', ac: 15, conditionIds: ['cego'] },
    ]);
  });

  it('sem Condições gravadas, a lista é vazia', () => {
    expect(
      buildAttackTargets([{ id: 'p5', entity_id: 'c2' }], 'p1', entities)[0].conditionIds,
    ).toEqual([]);
  });

  it('o participante que não está no elenco da sessão fica de fora', () => {
    expect(
      buildAttackTargets(participants, 'p1', entities).map((t) => t.participantId),
    ).not.toContain('p4');
  });
});
