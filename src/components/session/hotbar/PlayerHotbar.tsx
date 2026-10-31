// A Hotbar do jogador ligada à ficha e ao combate. Ela decide quando cada Habilidade fica bloqueada
// (usos, Fé, combate, turno e espaço do turno, pelas funções do motor), grava o uso e abre o
// painel de alvos das Habilidades com efeito de combate (ADR 0007) dentro do Cartão. A faixa dos
// espaços do turno fica acima das abas, só no combate. Termos: CONTEXT.md (Hotbar, Habilidade).
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
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
import { isAmmunitionItem } from '@/domain/ammo';
import { balmUseBlockMessage, getBalmUseBlock, isRestOnlyItem } from '@/domain/balm';
import { getTorchBlock, isTorchItem, torchBlockMessage } from '@/domain/torch';
import { lightTorch } from '@/data-access/torch';
import { isDying as isCharacterDying } from '@/domain/deathSaves';
import { getCurrentPv, getMaxPv } from '@/domain/vitals';
import { applyConsumableEffects, normalizeHealingEffects } from '@/domain/consumables';
import { resolveAmmunition, resolveMainHandWeapon } from '@/lib/attackSetup';
import { useUpdateNPCInventory } from '@/hooks/useUpdateNPCInventory';
import type { CombatInventoryItem, InventoryCatalogItem } from '@/types/inventory';
import { Hotbar, type HotbarAmmo, type HotbarEntry, type HotbarItem } from './Hotbar';

interface PlayerHotbarProps {
  character: Character | null | undefined;
  /** Quem está na sessão, com nome e CA: os alvos possíveis das Habilidades. */
  entities: { id: string; name: string; totalAc: number }[];
  /** Avisa a tela do que foi gravado na ficha, para a Hotbar mudar já. */
  onCharacterPatch?: (patch: Record<string, unknown>) => void;
  onOpenDice: () => void;
  /** O Descanso Curto da sessão está aberto (o Bálsamo só vale nele). */
  restOpen?: boolean;
  /** Abre o Painel Descanso, onde o Bálsamo é usado. */
  onOpenRest?: () => void;
}

export function PlayerHotbar({
  character,
  entities,
  onCharacterPatch,
  onOpenDice,
  restOpen = false,
  onOpenRest,
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
  const { consumeItem, isUpdating: isConsuming } = useUpdateNPCInventory();
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

  const ownedItems =
    (character as { character_items?: CombatInventoryItem[] }).character_items ?? [];
  const catalogOf = (owned: CombatInventoryItem): InventoryCatalogItem | undefined =>
    Array.isArray(owned.items) ? owned.items[0] : (owned.items ?? undefined);

  // Os consumíveis que dá para usar (a munição se gasta ao atacar, não aqui).
  const usable = ownedItems.filter((owned) => {
    const catalog = catalogOf(owned);
    return !!catalog?.is_consumable && !isAmmunitionItem(catalog.name) && (owned.quantity ?? 0) > 0;
  });
  const balmBlock = (owned: CombatInventoryItem): string | null => {
    if (!isRestOnlyItem(catalogOf(owned)?.slug)) return null;
    const maxPv = getMaxPv(character.stats ?? {});
    const block = getBalmUseBlock({
      restOpen,
      isDead: Boolean(character.is_dead),
      isDying: isCharacterDying(character),
      quantity: owned.quantity ?? 0,
      currentPv: getCurrentPv(character.stats ?? {}, maxPv),
      maxPv,
    });
    return block ? balmUseBlockMessage(block) : null;
  };
  const torchLit = character.torch_lit === true;
  const torchBlock = (owned: CombatInventoryItem): string | null => {
    if (!isTorchItem(catalogOf(owned)?.slug)) return null;
    const block = getTorchBlock({
      lit: torchLit,
      isDead: Boolean(character.is_dead),
      quantity: owned.quantity ?? 0,
    });
    return block ? torchBlockMessage(block) : null;
  };
  const items: HotbarItem[] = usable.map((owned) => {
    const torch = isTorchItem(catalogOf(owned)?.slug);
    return {
      id: owned.id ?? '',
      name: catalogOf(owned)?.name ?? 'Item',
      quantity: owned.quantity ?? 0,
      description: catalogOf(owned)?.description ?? '',
      blockedReason: balmBlock(owned) ?? torchBlock(owned),
      ...(torch
        ? {
            freeAction: true,
            actionLabel: 'Acender',
            status: torchLit ? 'Acesa' : undefined,
          }
        : {}),
    };
  });
  // Acendeu a última Tocha: a linha do inventário some, mas a Tocha acesa continua à vista.
  if (torchLit && !items.some((item) => item.freeAction)) {
    items.push({
      id: 'tocha-acesa',
      name: 'Tocha',
      quantity: 0,
      description: 'Luz plena 6 m e mais 6 m de Penumbra. Apaga no Descanso Curto ou Longo.',
      blockedReason: torchBlockMessage('lit'),
      freeAction: true,
      actionLabel: 'Acender',
      status: 'Acesa',
    });
  }
  const ammunition = resolveAmmunition(
    { character_items: ownedItems },
    resolveMainHandWeapon({ equipment: character.equipment, character_items: ownedItems })
      ?.weapon ?? null,
  );
  const ammo: HotbarAmmo | null = ammunition
    ? { name: ammunition.name, quantity: ammunition.quantity }
    : null;

  const useItem = async (item: HotbarItem) => {
    const owned = ownedItems.find((o) => o.id === item.id);
    if (!owned || isConsuming) return;
    // O Bálsamo se usa no Painel Descanso (cura rolada na mesa); aqui só leva até lá.
    if (isRestOnlyItem(catalogOf(owned)?.slug)) {
      onOpenRest?.();
      return;
    }
    const catalog = catalogOf(owned);
    // A Tocha acende como Ação Livre: o banco gasta uma e acende numa transação só.
    if (isTorchItem(catalog?.slug)) {
      if (torchBlock(owned)) return;
      try {
        await lightTorch(character.id);
      } catch (error) {
        console.error('Erro ao acender a Tocha:', error);
        return;
      }
      const left = (owned.quantity ?? 0) - 1;
      onCharacterPatch?.({
        torch_lit: true,
        character_items:
          left <= 0
            ? ownedItems.filter((o) => o.id !== item.id)
            : ownedItems.map((o) => (o.id === item.id ? { ...o, quantity: left } : o)),
      });
      return;
    }
    const effects = normalizeHealingEffects(
      (catalog?.effects ?? {}) as { heal?: number; heal_dice?: string; restore_faith?: number },
      catalog?.description ?? undefined,
      owned.level || 1,
    );
    const quantity = owned.quantity ?? 0;
    const result = await consumeItem(
      character.id,
      item.id,
      quantity,
      effects,
      character.stats ?? {},
      !character.is_npc,
    );
    if (!result.success) return;
    const { stats, hasChanges } = applyConsumableEffects(character.stats ?? {}, effects);
    const character_items =
      quantity <= 1
        ? ownedItems.filter((o) => o.id !== item.id)
        : ownedItems.map((o) => (o.id === item.id ? { ...o, quantity: quantity - 1 } : o));
    onCharacterPatch?.({ character_items, ...(hasChanges ? { stats } : {}) });
  };

  const spendUse = async (ability: AbilityDefinition) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const used = applyAbilityUse(ability, abilitySkills(character), character.stats);
      // Sem Fé para o custo: nada é gasto.
      if (!used) return;
      const patch = { skills: used.skills, ...(used.stats ? { stats: used.stats } : {}) };
      await updateCharacter(character.id, patch);
      onCharacterPatch?.(patch);
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
    <div
      data-my-turn={isMyTurn && !isDying ? 'true' : undefined}
      className={`relative ${isMyTurn && !isDying ? 'border-t-2 border-amber-500' : ''}`}
    >
      {isMyTurn && !isDying && (
        // A Hotbar acende uma vez quando o turno chega (só opacidade; a borda âmbar fica).
        <motion.span
          aria-hidden="true"
          data-testid="brilho-do-turno"
          className="pointer-events-none absolute inset-0 z-10 bg-amber-400/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      )}
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
        items={items}
        ammo={ammo}
        onUseItem={useItem}
        busy={isUpdating || isConsuming}
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
