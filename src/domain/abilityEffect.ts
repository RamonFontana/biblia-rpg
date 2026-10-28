// O efeito de combate de uma Habilidade (Onda 5, feature 4; ADR 0007): quem pode ser alvo, quando o
// uso é permitido e as Condições que chegam ao alvo depois da Resistência a Condição e das
// imunidades de Habilidade passiva.
// Termos: CONTEXT.md (Habilidade, Condição, Resistência a Condição).
import { ABILITIES } from '@/content/abilities';
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

/** A Condição a que cada Habilidade passiva pessoal torna o personagem imune (`conditionImmunity`). */
const ABILITY_IMMUNITIES = new Map(
  ABILITIES.flatMap((a) => (a.conditionImmunity ? [[a.id, a.conditionImmunity] as const] : [])),
);

/** As Condições a que as Habilidades (as que o personagem tem desbloqueadas) dão imunidade. */
export function abilityImmunities(abilityIds: string[]): string[] {
  return abilityIds.flatMap((id) => {
    const conditionId = ABILITY_IMMUNITIES.get(id);
    return conditionId ? [conditionId] : [];
  });
}

/** A Habilidade tira Condição dos alvos (aliados, sem TR e sem passar pela Resistência a Condição). */
export function hasRemoval(effect: Pick<AbilityEffect, 'targets' | 'remove'>): boolean {
  return effect.remove !== undefined;
}

/** O nome da Condição para o texto de tela. */
function conditionName(conditionId: string): string {
  return CONDITIONS[conditionId]?.name ?? conditionId;
}

/** "A", "A ou B", "A, B ou C". */
function joinOr(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} ou ${names[names.length - 1]}`;
}

/**
 * As Condições que a Habilidade pode tirar de um alvo que tem estas: as da lista que ele tem
 * (remoção fixa ou escolhida) ou qualquer uma que ele tenha (uma por alvo).
 */
export function removableConditions(
  effect: Pick<AbilityEffect, 'targets' | 'remove'>,
  targetConditionIds: string[],
): string[] {
  const { remove } = effect;
  if (!remove) return [];
  if (remove.mode === 'per_target') return [...targetConditionIds];
  return targetConditionIds.filter((id) => remove.conditionIds.includes(id));
}

/** O que a Habilidade tira, para o texto do painel ("Envenenado", "A, B ou C", "uma Condição…"). */
export function describeRemoval(effect: Pick<AbilityEffect, 'remove'>): string {
  const { remove } = effect;
  if (!remove) return '';
  if (remove.mode === 'per_target') return 'uma Condição à sua escolha de cada aliado';
  return joinOr(remove.conditionIds.map(conditionName));
}

/** Um aliado que vai perder Condição: o que ele tem agora. */
export interface RemovalTarget {
  participantId: string;
  name: string;
  conditionIds: string[];
}

/** A Condição que o jogador escolheu tirar de cada alvo, pelo id do participante. */
export type RemovalChoices = Record<string, string | undefined>;

/**
 * Por que a escolha das Condições a tirar não está pronta, ou `null` se está. A remoção fixa não
 * pede escolha; nas outras, cada alvo que tem o que tirar precisa de uma escolha válida.
 */
export function removalBlock(
  effect: Pick<AbilityEffect, 'targets' | 'remove'>,
  targets: RemovalTarget[],
  choices: RemovalChoices,
): string | null {
  const { remove } = effect;
  if (!remove || remove.mode === 'fixed') return null;
  for (const target of targets) {
    if (removableConditions(effect, target.conditionIds).length === 0) continue;
    const chosen = choices[target.participantId];
    if (!chosen) return `Escolha a Condição que sai de ${target.name}`;
    if (remove.mode === 'choice' && !remove.conditionIds.includes(chosen)) {
      return `${conditionName(chosen)} não pode sair de ${target.name}`;
    }
    if (!target.conditionIds.includes(chosen)) {
      return `${target.name} não tem ${conditionName(chosen)}`;
    }
  }
  return null;
}

export interface RemovalResult {
  participantId: string;
  name: string;
  /** As Condições que saem do alvo. */
  removed: string[];
  /** O aviso para o Mestre quando o alvo não tinha o que tirar. */
  messages: string[];
}

/**
 * As Condições que saem de cada alvo. Quem não tem o que tirar é ignorado e vira um aviso
 * ("não tinha Envenenado"). Tirar Condição de um aliado não passa pela Resistência a Condição.
 */
export function resolveAbilityRemoval(
  effect: Pick<AbilityEffect, 'targets' | 'remove'>,
  targets: RemovalTarget[],
  choices: RemovalChoices,
): RemovalResult[] {
  const { remove } = effect;
  return targets.map(({ participantId, name, conditionIds }) => {
    const removable = removableConditions(effect, conditionIds);
    const chosen = choices[participantId];
    let removed: string[] = [];
    if (remove?.mode === 'fixed') removed = removable;
    else if (chosen && removable.includes(chosen)) removed = [chosen];

    let messages: string[] = [];
    if (removed.length === 0) {
      const wanted =
        remove && remove.mode !== 'per_target'
          ? `não tinha ${joinOr(remove.conditionIds.map(conditionName))}`
          : 'não tinha Condição a remover';
      messages = [wanted];
    }
    return { participantId, name, removed, messages };
  });
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
  for (const { conditionId, rounds } of effect.apply ?? []) {
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
  targets: {
    name: string;
    conditionIds: string[];
    failed?: boolean;
    /** Só nos usos que tiram Condição: as que saíram e o aviso de quem não tinha o que tirar. */
    removedIds?: string[];
    messages?: string[];
    /** Só nas Habilidades de inimigo que tiram Fé: quanto este alvo perdeu (0 se passou). */
    faithLost?: number;
  }[];
}): string {
  const parts = use.targets.map((t) => {
    if (t.faithLost !== undefined && t.failed) {
      const lost = `perdeu ${t.faithLost} de Fé`;
      return t.conditionIds.length > 0
        ? `${t.name} ficou ${t.conditionIds.map(conditionName).join(' e ')} e ${lost}`
        : `${t.name} falhou no TR e ${lost}`;
    }
    if (t.removedIds !== undefined) {
      if (t.removedIds.length > 0) {
        return `${t.name} deixou de estar ${t.removedIds.map(conditionName).join(' e ')}`;
      }
      return `${t.name} ${t.messages?.[0] ?? 'não tinha Condição a remover'}`;
    }
    if (t.conditionIds.length > 0) {
      return `${t.name} ficou ${t.conditionIds.map(conditionName).join(' e ')}`;
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
  /** Só nos usos que tiram Condição: as que saíram do alvo. */
  removedIds?: string[];
  /** Só nos usos com TR já resolvidos: o dado que valeu, o total e se o alvo falhou. */
  natural?: number;
  total?: number;
  failed?: boolean;
  /** Só nas Habilidades de inimigo que tiram Fé: a Fé que o alvo perdeu. */
  faithLost?: number;
}

/** Os alvos de um uso gravado (`targets` é `jsonb`): o nome, as Condições que chegaram e o TR. */
export function abilityUseTargets(targets: unknown): AbilityUseTarget[] {
  if (!Array.isArray(targets)) return [];
  return targets.map(
    (t: {
      participantId: string;
      name: string;
      conditions?: ConditionEntry[];
      removed?: string[];
      natural?: number;
      total?: number;
      failed?: boolean;
      faithLost?: number;
    }) => ({
      participantId: t.participantId,
      name: t.name,
      conditionIds: (t.conditions ?? []).map((c) => c.conditionId),
      ...(t.removed && { removedIds: t.removed }),
      ...(t.failed !== undefined && { natural: t.natural, total: t.total, failed: t.failed }),
      ...(t.faithLost !== undefined && { faithLost: t.faithLost }),
    }),
  );
}
