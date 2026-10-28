import { useCombatStore } from '../../store/combatStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
// import { Button } from '../ui/button';
import { CharacterAvatar } from '../ui/CharacterAvatar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { updateCharacter } from '@/data-access/characters';
import { DeathSavesModal } from './DeathSavesModal';
import { EnemyCombatList } from './EnemyCombatList';
import { AttackPanel } from './AttackPanel';
import { AbilityUsePanel } from './AbilityUsePanel';
import { abilitySkills, getAbilitiesForCharacter } from '../../utils/abilityUtils';
import { AbilityCard } from './AbilityCard';
import type { AbilityDefinition } from '@/content/schemas';
import type { Character } from '../../features/character-management/types';
import { buildAttackTargets, conditionIdsOf } from '@/lib/attackSetup';
import { getInspirationStatus } from '@/domain/inspiration';
import { describeHitOnTarget } from '@/domain/attack';
import { useCombatAttackEvents } from '@/hooks/useCombatAttackEvents';
import type { CombatInventoryItem } from '@/types/inventory';
import { applyAbilityUse, getAbilityAvailability } from '@/domain/abilityUse';
import { effectTargetPool, getAbilityEffectBlock } from '@/domain/abilityEffect';
import { abilityCd } from '@/domain/abilitySave';
import { submitAbilityUse } from '@/services/abilityService';
import { getMaxPv } from '@/domain/vitals';

interface PlayerCombatViewProps {
  // A ficha do jogador; com os itens aninhados (`character_items`), a arma do ataque sai deles.
  character: (Character & { character_items?: CombatInventoryItem[] }) | null | undefined;
  enemies: Character[];
  isLoading: boolean;
  /** Quem está na sessão, com nome e CA: os alvos possíveis do ataque. */
  entities?: { id: string; name: string; totalAc: number }[];
  /** A sessão e o dia de agora: a Inspiração gasta no ataque é do dia. */
  inspirationContext?: { sessionId: string; day: number };
  /** Avisa a tela do dia gravado quando o ataque gastou a Inspiração. */
  onInspirationUsed?: (patch: {
    inspiration_used_day: number;
    inspiration_session_id: string;
  }) => void;
}

export function PlayerCombatView({
  character,
  enemies,
  isLoading,
  entities = [],
  inspirationContext,
  onInspirationUsed,
}: PlayerCombatViewProps) {
  const playerId = character?.id;
  const [isUpdating, setIsUpdating] = useState(false);
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

  const [usingAbilityId, setUsingAbilityId] = useState<string | null>(null);
  // O uso que acabou de ser gravado: o resultado do TR chega pelo armazém quando o Mestre lança.
  const [lastUseId, setLastUseId] = useState<string | null>(null);

  const handleUseAbility = async (ability: AbilityDefinition) => {
    if (!character || isUpdating) return;

    // Com combate ativo, a Habilidade com efeito abre o painel de alvos (ADR 0007); sem combate,
    // ou sem efeito, só gasta o uso e a Fé.
    if (ability.combatEffect && activeCombat) {
      setUsingAbilityId(ability.id);
      return;
    }

    // Optimistic UI state could be handled here if we tracked it locally,
    // but we'll rely on the parent component's real-time subscription or fast refetch.
    setIsUpdating(true);

    try {
      const used = applyAbilityUse(ability, abilitySkills(character), character.stats);

      if (!used) {
        // Not enough faith
        setIsUpdating(false);
        return;
      }

      await updateCharacter(character.id, {
        skills: used.skills,
        ...(used.stats ? { stats: used.stats } : {}),
      });
    } catch (error) {
      console.error('Failed to use ability:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const characterAbilities = useMemo(() => {
    if (!character || !character.tribe || !character.vocation || !character.level) return [];

    // Convert level (could be string if from older DB but should be number)
    const level = Number(character.level) || 1;
    const pathChoices = abilitySkills(character)?.path_choices;

    return getAbilitiesForCharacter(character.tribe, character.vocation, level, pathChoices);
  }, [character]);

  // O aviso de quem foi atingido: só ataques ao vivo, e some sozinho.
  const [hitNotice, setHitNotice] = useState<string | null>(null);
  const hitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const myParticipantId = participants.find((p) => p.entity_id === playerId)?.id;
  useCombatAttackEvents((attack) => {
    if (!myParticipantId || attack.target_participant_id !== myParticipantId) return;
    if (!attack.hit || attack.damage <= 0) return;
    clearTimeout(hitTimer.current);
    setHitNotice(
      describeHitOnTarget({
        attackerName: attack.attacker_name,
        damage: attack.damage,
        critical: attack.critical,
      }),
    );
    hitTimer.current = setTimeout(() => setHitNotice(null), 6000);
  });
  useEffect(() => () => clearTimeout(hitTimer.current), []);

  const isMyTurn = activeCombat && currentTurnParticipant?.entity_id === playerId;
  const participant = participants.find((p) => p.entity_id === playerId);
  const isDying = activeCombat && participant && participant.hp_current <= 0;

  // A Habilidade com efeito que o jogador está usando agora (o painel de alvos).
  const usingAbility = characterAbilities.find((a) => a.id === usingAbilityId);
  const abilityBlock = (ability: AbilityDefinition) => {
    const availability = getAbilityAvailability(
      ability,
      abilitySkills(character),
      character?.stats,
    );
    if (availability.disabled) return availability.reason;
    return getAbilityEffectBlock({
      actionType: ability.actionType,
      hasActiveCombat: !!activeCombat,
      dying: !!isDying,
      isMyTurn: !!isMyTurn,
      actionUsed: hasUsedAction,
      bonusActionUsed: hasUsedBonusAction,
      reactionUsed: hasUsedReaction,
    });
  };
  // Usar a Habilidade ocupa o espaço do turno dela (Ação, Ação Bônus ou Reação).
  const markTurnSlot = (actionType: string) => {
    if (actionType === 'action' && !hasUsedAction) toggleAction();
    if (actionType === 'bonus_action' && !hasUsedBonusAction) toggleBonusAction();
    if (actionType === 'reaction' && !hasUsedReaction) toggleReaction();
  };

  return (
    <div className="space-y-6">
      {/* Character Profile Header */}
      {character && (
        <div className="flex items-center gap-4 p-4 bg-stone-900 border border-stone-800 rounded-lg shadow-sm">
          <CharacterAvatar
            imageUrl={character.narrative?.imageUrl}
            name={character.name || 'Desconhecido'}
            className="w-16 h-16 border-2 border-stone-700"
          />
          <div>
            <h2 className="text-xl font-bold text-stone-200">{character.name || 'Desconhecido'}</h2>
            <div className="text-sm text-stone-400">
              {character.tribe && <span>{character.tribe}</span>}
              {character.vocation && <span className="ml-2">• {character.vocation}</span>}
            </div>
          </div>
          {/* O dano e a cura do Mestre vão para o participante; a ficha só recebe o PV no fim do
              combate. Por isso o PV daqui sai do participante, e não da ficha. */}
          {activeCombat && participant && (
            <div className="ml-auto text-right">
              <div className="text-xs uppercase tracking-wider text-stone-400">PV em combate</div>
              <div className={`text-2xl font-bold ${isDying ? 'text-red-400' : 'text-amber-400'}`}>
                {participant.hp_current}/{getMaxPv(character.stats)}
              </div>
            </div>
          )}
        </div>
      )}

      {hitNotice && (
        <div
          role="status"
          className="rounded-md border border-red-700/50 bg-red-900/30 p-3 text-sm font-medium text-red-400"
        >
          {hitNotice}
        </div>
      )}

      {activeCombat && (
        <>
          {/* Render the Enemy List */}
          <EnemyCombatList enemies={enemies} isLoading={isLoading} />

          {isDying && <DeathSavesModal character={character} participantId={participant.id} />}

          {isMyTurn && !isDying && (
            <div className="bg-primary/20 border-2 border-primary rounded-lg p-6 text-center animate-in fade-in zoom-in flex flex-col items-center gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-primary uppercase tracking-widest">
                  É O SEU TURNO!
                </h2>
                <p className="text-muted-foreground mt-2">Escolha suas ações com sabedoria.</p>
              </div>
            </div>
          )}

          {isMyTurn && !isDying && character && participant && (
            <AttackPanel
              character={character}
              characterId={character.id}
              attackerParticipantId={participant.id}
              attackerConditionIds={conditionIdsOf(participant.conditions)}
              inspiration={
                inspirationContext && {
                  available:
                    getInspirationStatus({
                      stats: character.stats,
                      usedDay: character.inspiration_used_day,
                      usedSessionId: character.inspiration_session_id,
                      ...inspirationContext,
                    }) === 'disponivel',
                  ...inspirationContext,
                }
              }
              onInspirationUsed={onInspirationUsed}
              targets={buildAttackTargets(participants, participant.id, entities)}
              actionUsed={hasUsedAction}
              onActionUsed={() => {
                if (!hasUsedAction) toggleAction();
              }}
            />
          )}

          {!isDying && (
            <Card className={isMyTurn ? 'border-primary ring-1 ring-primary' : ''}>
              <CardHeader>
                <CardTitle>Checklist de Ações (Sua Referência)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="movement"
                    checked={hasUsedMovement}
                    onCheckedChange={toggleMovement}
                  />
                  <Label htmlFor="movement" className="text-lg">
                    Movimento
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="action" checked={hasUsedAction} onCheckedChange={toggleAction} />
                  <Label htmlFor="action" className="text-lg">
                    Ação Principal
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bonus"
                    checked={hasUsedBonusAction}
                    onCheckedChange={toggleBonusAction}
                  />
                  <Label htmlFor="bonus" className="text-lg">
                    Ação Bônus
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reaction"
                    checked={hasUsedReaction}
                    onCheckedChange={toggleReaction}
                  />
                  <Label htmlFor="reaction" className="text-lg">
                    Reação
                  </Label>
                </div>

                <p className="text-xs text-muted-foreground pt-4">
                  * Este checklist é apenas visual e não impede suas mecânicas in-game. Ele é limpo
                  automaticamente a cada mudança de turno.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-bold text-stone-200">Habilidades</h3>
        {usingAbility?.combatEffect && character && participant && (
          <AbilityUsePanel
            ability={usingAbility}
            targets={effectTargetPool(
              usingAbility.combatEffect,
              buildAttackTargets(participants, participant.id, entities),
            )}
            blockedReason={abilityBlock(usingAbility)}
            cd={
              usingAbility.combatEffect.save
                ? abilityCd({
                    vocation: character.vocation,
                    level: Number(character.level) || 1,
                    attributes: character.attributes,
                  })
                : undefined
            }
            liveUse={abilityUses.find((use) => use.id === lastUseId)}
            onUse={async (selected, removals) => {
              const outcome = await submitAbilityUse({
                ability: usingAbility,
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
              markTurnSlot(usingAbility.actionType);
              return outcome;
            }}
            onClose={() => setUsingAbilityId(null)}
          />
        )}
        {characterAbilities.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma habilidade disponível.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characterAbilities.map((ability) => {
              const availability = getAbilityAvailability(
                ability,
                abilitySkills(character),
                character?.stats,
              );
              const currentUses = availability.remainingUses;
              let disabled: boolean;
              let disabledReason: string;

              if (!activeCombat && ability.usageType === 'combat') {
                disabled = true;
                disabledReason = 'Apenas em combate';
              } else if (isUpdating) {
                disabled = true;
                disabledReason = '';
              } else {
                disabled = availability.disabled;
                disabledReason = availability.reason;
              }

              return (
                <AbilityCard
                  key={ability.id}
                  ability={ability}
                  currentUses={currentUses}
                  onUse={() => handleUseAbility(ability)}
                  disabled={disabled}
                  disabledReason={disabledReason}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
