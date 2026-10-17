// CARACTERIZAÇÃO: fixa o comportamento ATUAL das linhas criadas para NPC jogável e inimigo.
// Decisões: ROADMAP.md, Onda 2 (bloco B): o NPC jogável usa as mesmas chaves das fichas.
// Termos: CONTEXT.md (Personagem, Fé Inicial, PV).
import { describe, expect, it } from 'vitest';
import { getCombatStats } from './equipmentUtils';
import { calculateModifier } from '@/domain/attributes';
import { buildEnemyRow, buildPlayableNpcRow } from './sessionEntities';

const npc = (characterData?: Record<string, unknown>) => ({
  id: 'tmp-1',
  name: 'Eliabe',
  description: 'Escudeiro do grupo',
  isPlayable: true,
  characterData,
});

describe('buildPlayableNpcRow', () => {
  const row = buildPlayableNpcRow(
    npc({ tribo: 'Judá', classe: 'Guerreiro', for: 16, des: 14, con: 12, level: 3, ca: 15 }),
    'user-1',
  );

  it('pertence ao Mestre e é marcado como NPC', () => {
    expect(row.user_id).toBe('user-1');
    expect(row.is_npc).toBe(true);
  });

  it('copia nome, Tribo, Vocação e biografia', () => {
    expect(row).toMatchObject({ name: 'Eliabe', tribe: 'Judá', vocation: 'Guerreiro' });
    expect(row.narrative.biography).toBe('Escudeiro do grupo');
  });

  it('atributo ausente ou 0 vira 10', () => {
    const empty = buildPlayableNpcRow(npc({ for: 0 }), 'u');
    expect(empty.attributes.strength).toBe(10);
    expect(empty.attributes.charisma).toBe(10);
  });

  it('PV é sempre 10, Fé sempre 100 e Fortaleza/Tentação são fixas', () => {
    expect(row.stats).toMatchObject({ pv: 10, current_pv: 10, current_faith: 100, max_faith: 100 });
    expect(row.fortress).toBe('Coragem');
    expect(row.temptation).toBe('Ganância');
  });

  it('BUG conhecido: os atributos usam chaves em inglês que nenhum leitor entende', () => {
    // A ficha lê for/des/con/int/sab/car; o NPC grava strength/dexterity/...
    expect(Object.keys(row.attributes)).toEqual([
      'strength',
      'dexterity',
      'constitution',
      'intelligence',
      'wisdom',
      'charisma',
    ]);
    const asSheetSees = row.attributes as Record<string, number>;
    expect(calculateModifier(asSheetSees['for'])).toBe(0);
  });

  it('BUG conhecido: a CA vai em stats.armor_class e a ficha lê stats.ca (resulta em CA 10)', () => {
    expect(row.stats.armor_class).toBe(15);
    const sheet = getCombatStats({ stats: row.stats, equipment: {}, character_items: [] });
    expect(sheet.totalAc).toBe(10);
  });

  it('BUG conhecido: a Fé máxima fica em max_faith e a Fé Inicial (faith) não é gravada', () => {
    expect(row.stats).not.toHaveProperty('faith');
  });

  it('sem dados do personagem usa os padrões', () => {
    const bare = buildPlayableNpcRow(npc(undefined), 'u');
    expect(bare).toMatchObject({ tribe: '', vocation: '' });
    expect(bare.stats.level).toBe(1);
    expect(bare.stats.armor_class).toBe(10);
  });
});

describe('buildEnemyRow', () => {
  const enemy = {
    id: 'tmp-2',
    name: 'Soldado Filisteu',
    hpMax: 22,
    hpCurrent: 18,
    ca: 13,
    vocation: 'Guerreiro',
    attributes: { for: 14, des: 12, con: 13, int: 8, sab: 10, car: 9 },
    skills: [{ name: 'Golpe', description: 'Ataque pesado' }],
    imageBase64: 'data:image/png;base64,AAA',
  };
  const row = buildEnemyRow(enemy, 'user-1');

  it('é marcado como inimigo, tribo "Inimigo", e já conta como participante', () => {
    expect(row).toMatchObject({
      is_enemy: true,
      tribe: 'Inimigo',
      has_participated_in_session: true,
      user_id: 'user-1',
    });
  });

  it('usa as chaves de atributo da ficha (for/des/…)', () => {
    expect(row.attributes).toEqual(enemy.attributes);
  });

  it('PV, PV atual e CA vêm do rascunho; Fé é 0', () => {
    expect(row.stats).toEqual({ pv: 22, current_pv: 18, ca: 13, faith: 0, current_faith: 0 });
  });

  it('a imagem fica em narrative.imageUrl, em base64', () => {
    expect(row.narrative.imageUrl).toBe('data:image/png;base64,AAA');
  });

  it('atributo ausente vira 0 (modificador -5)', () => {
    const bare = buildEnemyRow({ ...enemy, attributes: undefined }, 'u');
    expect(bare.attributes.for).toBe(0);
    expect(calculateModifier(bare.attributes.for)).toBe(-5);
  });

  it('sem Vocação, habilidades ou imagem usa vazios', () => {
    const bare = buildEnemyRow({ id: 't', name: 'X', hpMax: 1, hpCurrent: 1, ca: 10 }, 'u');
    expect(bare).toMatchObject({ vocation: '', skills: [] });
    expect(bare.narrative.imageUrl).toBe('');
  });
});
