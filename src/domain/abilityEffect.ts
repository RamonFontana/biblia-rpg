// O efeito de combate de uma Habilidade (Onda 5, feature 4; ADR 0007): quem pode ser alvo, quando o
// uso é permitido e as Condições que chegam ao alvo depois da Resistência a Condição e das
// imunidades de Habilidade passiva.
// Termos: CONTEXT.md (Habilidade, Condição, Resistência a Condição).
import { CONDITIONS } from '@/content/conditions';
import type { AbilityEffect } from '@/content/schemas';
import type { ConditionEntry } from '@/types/combat';
import { saveAttributeLabel, type SaveAttribute } from './abilitySave';
import { applyConditionResistance } from './armorResistance';

/** O que o efeito lê de um participante do combate para saber se ele é um alvo possível. */
export interface EffectTargetCandidate {
  entityType: string;
}

/** Os alvos possíveis: inimigos para "inimigo(s)", jogadores e NPCs para "aliado(s)", todos para o agressor. */
export function effectTargetPool<T extends EffectTargetCandidate>(
  effect: AbilityEffect,
  participants: T[],
): T[] {
  switch (effect.targets) {
    case 'enemy':
    case 'enemies':
      return participants.filter((p) => p.entityType === 'enemy');
    case 'ally':
    case 'allies':
      return participants.filter((p) => p.entityType !== 'enemy');
    case 'aggressor':
      return participants;
  }
}

/** O jogador marca um alvo só (inimigo, aliado, agressor) ou vários (inimigos, aliados). */
export function isSingleTarget(effect: Pick<AbilityEffect, 'targets'>): boolean {
  return effect.targets === 'enemy' || effect.targets === 'ally' || effect.targets === 'aggressor';
}

/** A Condição a que cada Habilidade passiva pessoal torna o personagem imune. */
const ABILITY_IMMUNITIES: Record<string, string> = {
  'tribe-aser-4-calcado-de-ferr': 'caido',
  'tribe-naftali-20-rapidez-divina': 'paralisado',
  'tribe-simeao-12-sangue-amargo': 'envenenado',
  'vocation-sacerdote-18-servo-consagrad': 'amedrontado',
};

/** As Condições a que as Habilidades (as que o personagem tem desbloqueadas) dão imunidade. */
export function abilityImmunities(abilityIds: string[]): string[] {
  return abilityIds.flatMap((id) => (ABILITY_IMMUNITIES[id] ? [ABILITY_IMMUNITIES[id]] : []));
}

export interface AbilityUseContext {
  actionType: string;
  hasActiveCombat: boolean;
  /** O usuário está a 0 PV. */
  dying: boolean;
  isMyTurn: boolean;
  actionUsed: boolean;
  bonusActionUsed: boolean;
  reactionUsed: boolean;
}

/**
 * Por que a Habilidade não pode ser usada agora, ou `null` se pode. Os usos e a Fé são conferidos à
 * parte (`getAbilityAvailability`). Ação e Ação Bônus são do próprio turno; a Reação vale a
 * qualquer momento (a Retribuição Divina dispara quando um aliado cai).
 */
export function getAbilityEffectBlock(ctx: AbilityUseContext): string | null {
  if (ctx.actionType === 'passive') return 'Habilidade passiva';
  if (!ctx.hasActiveCombat) return 'Só em combate';
  if (ctx.dying) return 'Quem está a 0 PV não usa Habilidades';

  if (ctx.actionType === 'action') {
    if (!ctx.isMyTurn) return 'Não é o seu turno';
    if (ctx.actionUsed) return 'Ação já usada neste turno';
  } else if (ctx.actionType === 'bonus_action') {
    if (!ctx.isMyTurn) return 'Não é o seu turno';
    if (ctx.bonusActionUsed) return 'Ação Bônus já usada neste turno';
  } else if (ctx.actionType === 'reaction') {
    if (ctx.reactionUsed) return 'Reação já usada neste turno';
  }
  return null;
}

export interface TargetProtection {
  /** O nível de Resistência a Condição do alvo, por Condição (itens equipados). */
  resistanceLevels: Record<string, number>;
  /** As Condições a que o alvo é imune por Habilidade passiva. */
  immuneConditionIds: string[];
}

/**
 * As Condições que chegam a um alvo e as frases de proteção para o Mestre. A imunidade de
 * Habilidade passiva anula a Condição; a Resistência a Condição de armadura pode reduzir a duração
 * ou anular. Sem duração no conteúdo, a Condição fica até ser removida (`duration` nulo).
 */
export function resolveAbilityEffect(
  effect: AbilityEffect,
  protection: TargetProtection,
): { conditions: ConditionEntry[]; messages: string[] } {
  const conditions: ConditionEntry[] = [];
  const messages: string[] = [];
  for (const { conditionId, rounds } of effect.apply) {
    if (protection.immuneConditionIds.includes(conditionId)) {
      messages.push(`Imunidade: imune a ${CONDITIONS[conditionId]?.name ?? conditionId}`);
      continue;
    }
    const outcome = applyConditionResistance(
      conditionId,
      rounds ?? null,
      protection.resistanceLevels[conditionId] ?? 0,
    );
    if (outcome.message) messages.push(outcome.message);
    if (!outcome.immune) conditions.push({ conditionId, duration: outcome.duration });
  }
  return { conditions, messages };
}

/** A frase do uso para o histórico e o aviso: quem usou, a Habilidade e o que chegou a cada alvo. */
export function describeAbilityUse(use: {
  userName: string;
  abilityName: string;
  targets: { name: string; conditionIds: string[]; failed?: boolean }[];
}): string {
  const parts = use.targets.map((t) => {
    if (t.conditionIds.length > 0) {
      return `${t.name} ficou ${t.conditionIds.map((id) => CONDITIONS[id]?.name ?? id).join(' e ')}`;
    }
    if (t.failed === undefined) return `${t.name} resistiu`;
    return t.failed ? `${t.name} falhou no TR, mas resistiu à Condição` : `${t.name} passou no TR`;
  });
  return `${use.userName} usou ${use.abilityName}: ${parts.join('; ')}.`;
}

/** A frase de um uso com TR que espera o Mestre lançar os testes. */
export function describePendingUse(use: {
  userName: string;
  abilityName: string;
  cd: number;
  attribute: SaveAttribute;
}): string {
  return `${use.userName} usou ${use.abilityName}: aguardando o Mestre lançar o TR de ${saveAttributeLabel(use.attribute)} (CD ${use.cd}).`;
}

export interface AbilityUseTarget {
  participantId: string;
  name: string;
  conditionIds: string[];
  /** Só nos usos com TR já resolvidos: o dado que valeu, o total e se o alvo falhou. */
  natural?: number;
  total?: number;
  failed?: boolean;
}

/** Os alvos de um uso gravado (`targets` é `jsonb`): o nome, as Condições que chegaram e o TR. */
export function abilityUseTargets(targets: unknown): AbilityUseTarget[] {
  if (!Array.isArray(targets)) return [];
  return targets.map(
    (t: {
      participantId: string;
      name: string;
      conditions?: ConditionEntry[];
      natural?: number;
      total?: number;
      failed?: boolean;
    }) => ({
      participantId: t.participantId,
      name: t.name,
      conditionIds: (t.conditions ?? []).map((c) => c.conditionId),
      ...(t.failed !== undefined && { natural: t.natural, total: t.total, failed: t.failed }),
    }),
  );
}
