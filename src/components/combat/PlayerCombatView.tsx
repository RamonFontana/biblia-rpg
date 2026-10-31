import { useCombatStore } from '../../store/combatStore';
// import { Button } from '../ui/button';
import { CharacterAvatar } from '../ui/CharacterAvatar';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { DeathSavesModal } from './DeathSavesModal';
import { EnemyCombatList } from './EnemyCombatList';
import { AttackPanel } from './AttackPanel';
import type { Character } from '../../features/character-management/types';
import { buildAttackTargets, conditionIdsOf } from '@/lib/attackSetup';
import { getInspirationStatus } from '@/domain/inspiration';
import { describeHitOnTarget } from '@/domain/attack';
import { useCombatAttackEvents } from '@/hooks/useCombatAttackEvents';
import type { CombatInventoryItem } from '@/types/inventory';
import { getMaxPv } from '@/domain/vitals';

interface PlayerCombatViewProps {
  // A ficha do jogador; com os itens aninhados (`character_items`), a arma do ataque sai deles.
  character: (Character & { character_items?: CombatInventoryItem[] }) | null | undefined;
  enemies: Character[];
  isLoading: boolean;
  /** Quem está na sessão, com nome e CA: os alvos possíveis do ataque. */
  entities?: { id: string; name: string; totalAc: number }[];
  /** A distância em metros até cada Retrato com pin no Mapa atual (a chave é o id do Retrato). */
  distances?: Record<string, number>;
  /** O participante que o jogador escolheu atacar pelo cartão do Retrato. */
  preselectedTargetId?: string;
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
  distances = {},
  preselectedTargetId,
  inspirationContext,
  onInspirationUsed,
}: PlayerCombatViewProps) {
  const playerId = character?.id;
  const { activeCombat, currentTurnParticipant, participants, hasUsedAction, toggleAction } =
    useCombatStore();

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
            <motion.div
              data-testid="faixa-do-turno"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-primary/20 border-2 border-primary rounded-lg p-6 text-center flex flex-col items-center gap-4"
            >
              <div>
                <h2 className="text-3xl font-extrabold text-primary uppercase tracking-widest">
                  É O SEU TURNO!
                </h2>
                <p className="text-muted-foreground mt-2">Escolha suas ações com sabedoria.</p>
              </div>
            </motion.div>
          )}

          {isMyTurn && !isDying && character && participant && (
            <AttackPanel
              key={preselectedTargetId ?? 'sem-alvo'}
              initialTargetId={preselectedTargetId}
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
              targets={buildAttackTargets(participants, participant.id, entities).map((target) =>
                distances[target.entityId] === undefined
                  ? target
                  : { ...target, distanceMeters: distances[target.entityId] },
              )}
              actionUsed={hasUsedAction}
              onActionUsed={() => {
                if (!hasUsedAction) toggleAction();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
