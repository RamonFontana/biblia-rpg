// A Hotbar do jogador ligada à ficha e ao combate. Ela decide quando cada Habilidade fica bloqueada
// (usos, Fé, combate, turno e espaço do turno, pelas funções do motor), grava o uso e abre o
// painel de alvos das Habilidades com efeito de combate (ADR 0007) dentro do Cartão. A faixa dos
// espaços do turno fica acima das abas, só no combate. Termos: CONTEXT.md (Hotbar, Habilidade).
import { useMemo, useState } from 'react';
import { updateCharacter } from '@/data-access/characters';
import { AbilityUsePanel } from '@/components/combat/AbilityUsePanel';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { AbilityDefinition } from '@/content/schemas';
import type { Character } from '@/features/character-management/types';
import { applyAbilityUse, getAbilityAvailability } from '@/domain/abilityUse';
import { effectTargetPool, getAbilityEffectBlock } from '@/domain/abilityEffect';
import { abilityCd } from '@/domain/abilitySave';
import { buildAttackTargets } from '@/lib/attackSetup';
import { submitAbilityUse } from '@/services/abilityService';
import { useCombatStore } from '@/store/combatStore';
import { abilitySkills, getAbilitiesForCharacter } from '@/utils/abilityUtils';
import { Hotbar, type HotbarEntry } from './Hotbar';

interface PlayerHotbarProps {
  character: Character | null | undefined;
  /** Quem está na sessão, com nome e CA: os alvos possíveis das Habilidades. */
  entities: { id: string; name: string; totalAc: number }[];
  /** Avisa a tela do que foi gravado na ficha, para a Hotbar mudar já. */
  onCharacterPatch?: (patch: Partial<Pick<Character, 'skills' | 'stats'>>) => void;
  onOpenDice: () => void;
}

export function PlayerHotbar({
  character,
  entities,
  onCharacterPatch,
  onOpenDice,
}: PlayerHotbarProps) {
  const {
    activeCombat,
    currentTurnParticipant,
    participants,
    abilityUses,
    hasUsedMovement,
    hasUsedAction,
    hasUsedBonusAction,
    hasUsedReaction,
    toggleMovement,
    toggleAction,
    toggleBonusAction,
    toggleReaction,
  } = useCombatStore();

  const [isUpdating, setIsUpdating] = useState(false);
  const [targetingId, setTargetingId] = useState<string | null>(null);
  // O uso que acabou de ser gravado: o resultado do TR chega pelo armazém quando o Mestre lança.
  const [lastUseId, setLastUseId] = useState<string | null>(null);

  const playerId = character?.id;
  const participant = participants.find((p) => p.entity_id === playerId);
  const isMyTurn = !!activeCombat && currentTurnParticipant?.entity_id === playerId;
  const isDying = !!activeCombat && !!participant && participant.hp_current <= 0;

  const characterAbilities = useMemo(() => {
    if (!character || !character.tribe || !character.vocation || !character.level) return [];
    // O nível pode vir como texto de fichas antigas.
    const level = Number(character.level) || 1;
    const pathChoices = abilitySkills(character)?.path_choices;
    return getAbilitiesForCharacter(character.tribe, character.vocation, level, pathChoices);
  }, [character]);

  if (!character) return null;

  const cd = abilityCd({
    vocation: character.vocation,
    level: Number(character.level) || 1,
    attributes: character.attributes,
  });

  const markTurnSlot = (actionType: string) => {
    if (actionType === 'action' && !hasUsedAction) toggleAction();
    if (actionType === 'bonus_action' && !hasUsedBonusAction) toggleBonusAction();
    if (actionType === 'reaction' && !hasUsedReaction) toggleReaction();
  };

  /** Por que a Habilidade não pode ser usada agora, ou `null`. Só as com efeito seguem o turno. */
  const blockedReason = (ability: AbilityDefinition): string | null => {
    if (!activeCombat && ability.usageType === 'combat') return 'Apenas em combate';
    const availability = getAbilityAvailability(ability, abilitySkills(character), character.stats);
    if (availability.disabled) return availability.reason;
    if (ability.combatEffect && activeCombat) {
      return getAbilityEffectBlock({
        actionType: ability.actionType,
        hasActiveCombat: true,
        dying: isDying,
        isMyTurn,
        actionUsed: hasUsedAction,
        bonusActionUsed: hasUsedBonusAction,
        reactionUsed: hasUsedReaction,
      });
    }
    return null;
  };

  const entries: HotbarEntry[] = characterAbilities.map((ability) => ({
    ability,
    remainingUses: getAbilityAvailability(ability, abilitySkills(character), character.stats)
      .remainingUses,
    blockedReason: blockedReason(ability),
    cd: ability.combatEffect?.save ? cd : undefined,
  }));

  const spendUse = async (ability: AbilityDefinition) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const used = applyAbilityUse(ability, abilitySkills(character), character.stats);
      // Sem Fé para o custo: nada é gasto.
      if (!used) return;
      const patch = { skills: used.skills, ...(used.stats ? { stats: used.stats } : {}) };
      await updateCharacter(character.id, patch);
      onCharacterPatch?.(patch as Partial<Pick<Character, 'skills' | 'stats'>>);
    } catch (error) {
      console.error('Failed to use ability:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const onUse = (ability: AbilityDefinition) => {
    // Com combate ativo, a Habilidade com efeito abre o painel de alvos (ADR 0007); sem combate,
    // ou sem efeito, só gasta o uso e a Fé.
    if (ability.combatEffect && activeCombat) {
      setTargetingId(ability.id);
      return 'targets' as const;
    }
    void spendUse(ability);
  };

  const renderTargeting = (ability: AbilityDefinition) => {
    if (!ability.combatEffect || !participant) return null;
    return (
      <AbilityUsePanel
        ability={ability}
        targets={effectTargetPool(
          ability.combatEffect,
          buildAttackTargets(participants, participant.id, entities),
        )}
        blockedReason={blockedReason(ability)}
        cd={ability.combatEffect.save ? cd : undefined}
        liveUse={abilityUses.find((use) => use.id === lastUseId)}
        onUse={async (selected, removals) => {
          const outcome = await submitAbilityUse({
            ability,
            userParticipantId: participant.id,
            targets: selected,
            removals,
            character: {
              id: character.id,
              skills: character.skills,
              stats: character.stats,
              vocation: character.vocation,
              level: character.level,
              attributes: character.attributes,
            },
          });
          setLastUseId(outcome.id);
          markTurnSlot(ability.actionType);
          return outcome;
        }}
        onClose={() => setTargetingId(null)}
      />
    );
  };

  return (
    <div>
      {activeCombat && !isDying && (
        <div
          role="group"
          aria-label="Espaços do turno"
          className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-stone-800 bg-stone-900 px-3 py-2"
        >
          <Slot
            id="movement"
            label="Movimento"
            checked={hasUsedMovement}
            onToggle={toggleMovement}
          />
          <Slot
            id="action"
            label="Ação Principal"
            checked={hasUsedAction}
            onToggle={toggleAction}
          />
          <Slot
            id="bonus"
            label="Ação Bônus"
            checked={hasUsedBonusAction}
            onToggle={toggleBonusAction}
          />
          <Slot id="reaction" label="Reação" checked={hasUsedReaction} onToggle={toggleReaction} />
        </div>
      )}
      <Hotbar
        entries={entries}
        onUse={onUse}
        onOpenDice={onOpenDice}
        busy={isUpdating}
        targetingId={targetingId}
        renderTargeting={renderTargeting}
        onCancelUse={() => setTargetingId(null)}
      />
    </div>
  );
}

function Slot({
  id,
  label,
  checked,
  onToggle,
}: {
  id: string;
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex min-h-11 items-center space-x-2">
      <Checkbox id={`slot-${id}`} checked={checked} onCheckedChange={onToggle} />
      <Label htmlFor={`slot-${id}`} className="text-sm">
        {label}
      </Label>
    </div>
  );
}
