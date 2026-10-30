// CARACTERIZAÇÃO: linhas de `characters` criadas ao preparar uma sessão (NPC jogável e inimigo),
// extraídas de sessionService.createGameSession sem alteração.
// Decisões: ROADMAP.md, Onda 2 (bloco B): o NPC jogável usa as mesmas chaves das fichas
// (for/des/con/int/sab/car) e a CA vem do equipamento, não de `stats`.
// Fortaleza e Tentação são fixas ('Coragem', 'Ganância').
import type { SessionEnemyDraft, SessionNPCDraft } from '../store/createSessionStore';

export function buildPlayableNpcRow(npc: SessionNPCDraft, userId: string) {
  const data = npc.characterData ?? {};
  return {
    user_id: userId, // Mestre "possui" o NPC por padrão
    is_npc: true,
    name: npc.name,
    tribe: data.tribo || '',
    vocation: data.classe || '',
    attributes: {
      for: data.for || 10,
      des: data.des || 10,
      con: data.con || 10,
      int: data.int || 10,
      sab: data.sab || 10,
      car: data.car || 10,
    },
    stats: {
      level: data.level || 1,
      pv: 10,
      current_pv: 10,
      current_faith: 100,
      max_faith: 100,
      experience: 0,
    },
    narrative: {
      biography: npc.description,
    },
    fortress: 'Coragem',
    temptation: 'Ganância',
  };
}

export function buildEnemyRow(enemy: SessionEnemyDraft, userId: string) {
  return {
    user_id: userId,
    is_enemy: true,
    name: enemy.name,
    vocation: enemy.vocation || '',
    tribe: 'Inimigo',
    has_participated_in_session: true,
    attributes: {
      for: enemy.attributes?.for || 0,
      des: enemy.attributes?.des || 0,
      con: enemy.attributes?.con || 0,
      int: enemy.attributes?.int || 0,
      sab: enemy.attributes?.sab || 0,
      car: enemy.attributes?.car || 0,
    },
    stats: {
      pv: enemy.hpMax,
      current_pv: enemy.hpCurrent,
      ca: enemy.ca,
      faith: 0,
      current_faith: 0,
    },
    skills: enemy.skills || [],
    narrative: {
      imageUrl: enemy.imageBase64 || '',
    },
  };
}
