// A Habilidade de inimigo contra personagens (Onda 5, feature 4; ADR 0007): qual efeito o app
// aplica, como ele aparece no texto e quem falhou no TR que os jogadores fizeram pelo Teste de
// sessão. A aleatoriedade é física (ADR 0001): o jogador rola, o app só confere.
// Termos: CONTEXT.md (Habilidade de inimigo, Recarga, TR, Resistência a Condição).
import { CONDITIONS } from '@/content/conditions';
import { findEnemyAbility } from '@/content/enemyAbilities';
import type { AbilityEffect, EnemyAbilityEffect } from '@/content/schemas';
import type { ConditionEntry } from '@/types/combat';
import { resolveAbilityEffect, type TargetProtection } from './abilityEffect';
import { saveAttributeLabel } from './abilitySave';

/** A Habilidade na ficha do inimigo: nome e texto, e o efeito (da biblioteca ou personalizado). */
export interface EnemySkillLike {
  name: string;
  description?: string;
  libraryId?: string;
  effect?: EnemyAbilityEffect;
}

export interface EnemyAbility {
  /** O id da biblioteca ou `enemy-custom` na Habilidade personalizada. */
  id: string;
  name: string;
  description: string;
  effect: EnemyAbilityEffect;
}

export const CUSTOM_ENEMY_ABILITY_ID = 'enemy-custom';

/**
 * A Habilidade que o app aplica, ou `null` se é só texto (inimigos antigos). A referência à
 * biblioteca vale mais que um efeito ao lado; uma referência desconhecida cai no texto.
 */
export function enemyAbilityOf(skill: EnemySkillLike): EnemyAbility | null {
  if (skill.libraryId) {
    const library = findEnemyAbility(skill.libraryId);
    return library
      ? {
          id: library.id,
          name: skill.name || library.name,
          description: skill.description || library.description,
          effect: library.effect,
        }
      : null;
  }
  if (skill.effect) {
    return {
      id: CUSTOM_ENEMY_ABILITY_ID,
      name: skill.name,
      description: skill.description ?? '',
      effect: skill.effect,
    };
  }
  return null;
}

/**
 * O efeito como o motor de Habilidade o lê, contra personagens (aliados do ponto de vista dos
 * jogadores). A CD fica fora: ela é gravada no uso.
 */
export function enemyEffectAsAbilityEffect(effect: EnemyAbilityEffect): AbilityEffect {
  return {
    targets: 'allies',
    ...(effect.save && { save: { attribute: effect.save.attribute } }),
    ...(effect.apply && { apply: effect.apply }),
  };
}

const USAGE_LABEL: Record<EnemyAbilityEffect['usage'], string | null> = {
  unlimited: null,
  per_combat: '1 por combate',
  recharge: 'Recarga 5-6',
};

/** O efeito em uma linha, para a ficha do inimigo e o painel do Mestre. */
export function describeEnemyEffect(effect: EnemyAbilityEffect): string {
  const parts: string[] = [];
  if (effect.save) {
    parts.push(`TR de ${saveAttributeLabel(effect.save.attribute)} CD ${effect.save.cd}`);
  }
  for (const { conditionId, rounds } of effect.apply ?? []) {
    const name = CONDITIONS[conditionId]?.name ?? conditionId;
    parts.push(`${name} (${rounds ? `${rounds} rodadas` : 'até ser removida'})`);
  }
  if (effect.faithLoss) parts.push(`perde 1d${effect.faithLoss.sides} de Fé`);
  const usage = USAGE_LABEL[effect.usage];
  if (usage) parts.push(usage);
  return parts.join(' · ');
}

/** O que o Teste de sessão de um alvo diz, mais a proteção dele contra a Condição. */
export interface EnemySaveResult {
  participantId: string;
  name: string;
  status: 'pending' | 'submitted';
  isApproved: boolean | null;
  rollValue: number | null;
  resultValue: number | null;
  appliedMode: string | null;
  protection: TargetProtection;
}

export interface EnemySaveOutcome {
  participantId: string;
  name: string;
  /** O jogador respondeu o TR. Sem resposta, o alvo fica sem efeito (o Mestre cancelou ou esperou). */
  answered: boolean;
  natural: number | null;
  total: number | null;
  failed: boolean;
  mode: string;
  conditions: ConditionEntry[];
  messages: string[];
}

/**
 * Quem falhou no TR e o que chega a cada um. Com TR, só quem respondeu e foi reprovado recebe a
 * Condição (depois da imunidade e da Resistência a Condição); sem resposta o alvo não sofre nada.
 * Sem TR na Habilidade, a Condição entra em todos.
 */
export function resolveEnemyAbilityResults(
  effect: EnemyAbilityEffect,
  results: EnemySaveResult[],
): EnemySaveOutcome[] {
  const abilityEffect = enemyEffectAsAbilityEffect(effect);
  return results.map((result) => {
    const answered = result.status === 'submitted';
    const failed = effect.save ? answered && result.isApproved === false : true;
    const applied =
      failed && abilityEffect.apply
        ? resolveAbilityEffect(abilityEffect, result.protection)
        : { conditions: [], messages: [] };
    return {
      participantId: result.participantId,
      name: result.name,
      answered,
      natural: answered ? result.rollValue : null,
      total: answered ? result.resultValue : null,
      failed: effect.save ? failed : false,
      mode: result.appliedMode ?? 'normal',
      conditions: applied.conditions,
      messages: applied.messages,
    };
  });
}
