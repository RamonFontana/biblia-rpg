import { useCombatStore } from '../../store/combatStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
// import { Button } from '../ui/button';
import { CharacterAvatar } from '../ui/CharacterAvatar';
import { useMemo, useState } from 'react';
import { updateCharacter } from '../../features/character-management/api/characterApi';
import { DeathSavesModal } from './DeathSavesModal';
import { EnemyCombatList } from './EnemyCombatList';
import { getAbilitiesForCharacter } from '../../utils/abilityUtils';
import { AbilityCard } from './AbilityCard';
import type { AbilityDefinition } from '../../data/abilities';
interface PlayerCombatViewProps {
  sessionId: string;
  character: any; // The current player character data
}

export function PlayerCombatView({ sessionId: _sessionId, character }: PlayerCombatViewProps) {
  const playerId = character?.id;
  const [isUpdating, setIsUpdating] = useState(false);
  const {
    activeCombat,
    currentTurnParticipant,
    participants,
    hasUsedMovement,
    hasUsedAction,
    hasUsedBonusAction,
    hasUsedReaction,
    toggleMovement,
    toggleAction,
    toggleBonusAction,
    toggleReaction
  } = useCombatStore();

  const handleUseAbility = async (ability: AbilityDefinition) => {
    if (!character || isUpdating) return;
    
    // Optimistic UI state could be handled here if we tracked it locally, 
    // but we'll rely on the parent component's real-time subscription or fast refetch.
    setIsUpdating(true);
    
    try {
      const skills = character.skills || {};
      const abilityUses = skills.ability_uses || {};
      const currentUsed = abilityUses[ability.id] || 0;
      
      const newSkills = {
        ...skills,
        ability_uses: {
          ...abilityUses,
          [ability.id]: currentUsed + 1
        }
      };
      
      const updates: any = { skills: newSkills };
      
      if (ability.faithCost) {
        const stats = character.stats || {};
        const currentFaith = stats.current_faith ?? stats.faith ?? 0;
        
        if (currentFaith >= ability.faithCost) {
          updates.stats = {
            ...stats,
            current_faith: currentFaith - ability.faithCost
          };
        } else {
          // Not enough faith
          setIsUpdating(false);
          return;
        }
      }
      
      await updateCharacter(character.id, updates);
      
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
    const pathChoices = character.skills?.path_choices;
    
    return getAbilitiesForCharacter(
      character.tribe,
      character.vocation,
      level,
      pathChoices
    );
  }, [character]);

  const isMyTurn = activeCombat && currentTurnParticipant?.entity_id === playerId;
  const participant = participants.find(p => p.entity_id === playerId);
  const isDying = activeCombat && participant && participant.hp_current <= 0;

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
        </div>
      )}

      {activeCombat && (
        <>
          {/* Render the Enemy List */}
          <EnemyCombatList sessionId={character?.session_id || _sessionId} />

          {isDying && (
            <DeathSavesModal character={character} participantId={participant.id} />
          )}

          {isMyTurn && !isDying && (
            <div className="bg-primary/20 border-2 border-primary rounded-lg p-6 text-center animate-in fade-in zoom-in flex flex-col items-center gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-primary uppercase tracking-widest">É O SEU TURNO!</h2>
                <p className="text-muted-foreground mt-2">Escolha suas ações com sabedoria.</p>
              </div>
            </div>
          )}

          {!isDying && (
            <Card className={isMyTurn ? 'border-primary ring-1 ring-primary' : ''}>
              <CardHeader>
                <CardTitle>Checklist de Ações (Sua Referência)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="movement" checked={hasUsedMovement} onCheckedChange={toggleMovement} />
                  <Label htmlFor="movement" className="text-lg">Movimento</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="action" checked={hasUsedAction} onCheckedChange={toggleAction} />
                  <Label htmlFor="action" className="text-lg">Ação Principal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="bonus" checked={hasUsedBonusAction} onCheckedChange={toggleBonusAction} />
                  <Label htmlFor="bonus" className="text-lg">Ação Bônus</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="reaction" checked={hasUsedReaction} onCheckedChange={toggleReaction} />
                  <Label htmlFor="reaction" className="text-lg">Reação</Label>
                </div>

                <p className="text-xs text-muted-foreground pt-4">
                  * Este checklist é apenas visual e não impede suas mecânicas in-game. Ele é limpo automaticamente a cada mudança de turno.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-bold text-stone-200">Habilidades</h3>
        {characterAbilities.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma habilidade disponível.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characterAbilities.map(ability => {
              const abilityUses = character?.skills?.ability_uses || {};
              const used = abilityUses[ability.id] || 0;
              const currentUses = ability.maxUses ? Math.max(0, ability.maxUses - used) : undefined;
              let disabled = false;
              let disabledReason = '';
              
              if (!activeCombat && ability.usageType === 'combat') {
                disabled = true;
                disabledReason = 'Apenas em combate';
              } else if (isUpdating) {
                disabled = true;
              } else {
                if (ability.faithCost) {
                  const currentFaith = character?.stats?.current_faith ?? character?.stats?.faith ?? 0;
                  if (currentFaith < ability.faithCost) {
                    disabled = true;
                    disabledReason = 'Fé Insuficiente';
                  }
                }
                
                if (!disabled && ability.maxUses) {
                  if (used >= ability.maxUses) {
                    disabled = true;
                    disabledReason = 'Sem Usos';
                  }
                }
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

      {/* <PhysicalRollForm playerId={playerId} character={character} /> */}
    </div>
  );
}
