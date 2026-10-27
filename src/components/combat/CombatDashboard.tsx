import { useEffect, useRef, useState } from 'react';
import { AttackLog } from './AttackLog';
import { describeStrikeOnDying } from '@/domain/attack';
import { useCombatAttackEvents } from '@/hooks/useCombatAttackEvents';
import { useCombatStore } from '../../store/combatStore';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { HealthModificationModal } from './HealthModificationModal';
import { MasterDeathControls } from './MasterDeathControls';
import { ConditionBadge } from '../conditions/ConditionBadge';
import { ConditionSelector } from '../conditions/ConditionSelector';
import { mergeCondition, removeCondition } from '@/domain/conditions';
import type { ConditionEntry } from '../../types/combat';

// O PV novo chega pelo tempo real. Aplicar outro valor antes disso partiria do PV velho, então o
// botão do participante espera este tempo depois de cada aplicação.
const HEALTH_COOLDOWN_MS = 1500;

interface CombatDashboardProps {
  availableEntities?: {
    id: string;
    name: string;
    type: 'player' | 'npc' | 'enemy';
    hpCurrent: number;
    totalAc?: number;
    weapon?: { name: string; damageDie: string };
    conditionResistanceLevels?: Record<string, number>;
  }[];
}

export function CombatDashboard({ availableEntities = [] }: CombatDashboardProps) {
  const {
    activeCombat,
    participants,
    attacks,
    abilityUses,
    currentTurnParticipant,
    nextTurn,
    endCombat,
  } = useCombatStore();

  // O golpe que atinge quem já estava Morrendo: o Mestre marca a falha no Teste de Morte, então o
  // aviso fica até ele dispensar. O inimigo a 0 PV não faz Teste de Morte.
  const [dyingNotices, setDyingNotices] = useState<{ id: string; text: string }[]>([]);
  useCombatAttackEvents((attack) => {
    const target = participants.find((p) => p.id === attack.target_participant_id);
    if (!attack.hit || attack.target_hp_before > 0 || !target || target.entity_type === 'enemy') {
      return;
    }
    setDyingNotices((notices) => [
      ...notices,
      {
        id: attack.id,
        text: describeStrikeOnDying({ targetName: attack.target_name, critical: attack.critical }),
      },
    ]);
  });

  const [selectedParticipant, setSelectedParticipant] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [cooling, setCooling] = useState<ReadonlySet<string>>(new Set());
  const cooldownTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const timers = cooldownTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);
  const startHealthCooldown = (participantId: string) => {
    setCooling((current) => new Set(current).add(participantId));
    const timer = setTimeout(() => {
      cooldownTimers.current.delete(timer);
      setCooling((current) => {
        const next = new Set(current);
        next.delete(participantId);
        return next;
      });
    }, HEALTH_COOLDOWN_MS);
    cooldownTimers.current.add(timer);
  };

  // O avanço e o fim leem o banco e gravam: enquanto um não termina, os dois botões esperam. Um
  // segundo clique partiria do mesmo turno (ou finalizaria o combate duas vezes).
  const [saving, setSaving] = useState(false);
  const runOnce = async (action: () => Promise<void>, failure: string) => {
    if (saving) return;
    setSaving(true);
    try {
      await action();
    } catch (error) {
      console.error(failure, error);
    } finally {
      setSaving(false);
    }
  };

  if (!activeCombat) {
    return (
      <div className="p-4 border rounded-md text-center bg-muted/50">
        <p className="text-muted-foreground">Nenhum combate ativo nesta sessão.</p>
      </div>
    );
  }

  const handleApplyDamage = (participantId: string, name: string) => {
    setSelectedParticipant({ id: participantId, name });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight truncate">
          Painel de Combate (Rodada {activeCombat.round_number})
        </h2>
        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <Button
            variant="destructive"
            disabled={saving}
            onClick={() => runOnce(endCombat, 'Erro ao finalizar o combate:')}
            className="flex-1 sm:flex-none"
          >
            Finalizar Combate
          </Button>
          <Button
            disabled={saving}
            onClick={() => runOnce(nextTurn, 'Erro ao avançar o turno:')}
            className="flex-1 sm:flex-none"
          >
            Próximo Turno
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {participants.map((participant) => {
          const isCurrentTurn = currentTurnParticipant?.id === participant.id;
          const entityDetails = availableEntities.find((e) => e.id === participant.entity_id);
          const displayName = entityDetails
            ? entityDetails.name
            : `${participant.entity_type} (Init: ${participant.initiative})`;
          const displayType = entityDetails ? entityDetails.type : participant.entity_type;

          return (
            <Card
              key={participant.id}
              className={isCurrentTurn ? 'border-primary ring-2 ring-primary ring-offset-2' : ''}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-start text-lg gap-2">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate" title={displayName}>
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize mt-1 font-normal truncate">
                      {displayType === 'player'
                        ? 'Personagem'
                        : displayType === 'enemy'
                          ? 'Inimigo'
                          : 'NPC'}{' '}
                      • Init: {participant.initiative}
                    </span>
                  </div>
                  {isCurrentTurn && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full whitespace-nowrap ml-2">
                      Turno Atual
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">HP Atual:</span>
                    <span className="font-bold text-lg">{participant.hp_current}</span>
                  </div>

                  {entityDetails?.totalAc !== undefined && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-muted-foreground">CA Total:</span>
                      <span className="font-bold">{entityDetails.totalAc}</span>
                    </div>
                  )}

                  {displayType === 'enemy' && entityDetails?.weapon && (
                    <div className="flex justify-between items-center mt-2 p-2 bg-stone-900 rounded border border-stone-800">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Arma:</span>
                        <span className="text-sm font-semibold text-amber-500">
                          {entityDetails.weapon.name}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground">Dano:</span>
                        <span className="text-sm font-bold">{entityDetails.weapon.damageDie}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {Array.isArray(participant.conditions) &&
                      (participant.conditions as unknown as ConditionEntry[]).map((condObj, i) => (
                        <ConditionBadge
                          key={i}
                          conditionId={condObj.conditionId}
                          duration={condObj.duration || undefined}
                          onRemove={async (conditionId) => {
                            const newConditions = removeCondition(
                              participant.conditions as unknown as ConditionEntry[],
                              conditionId,
                            );
                            await useCombatStore
                              .getState()
                              .updateConditions(participant.id, newConditions);
                          }}
                        />
                      ))}
                    <ConditionSelector
                      resistanceLevels={entityDetails?.conditionResistanceLevels}
                      onAddCondition={async (conditionId, duration) => {
                        const newCond: ConditionEntry = {
                          conditionId,
                          duration: duration > 0 ? duration : null,
                        };
                        const current =
                          (participant.conditions as unknown as ConditionEntry[] | null) || [];
                        const newConditions = mergeCondition(current, newCond);
                        await useCombatStore
                          .getState()
                          .updateConditions(participant.id, newConditions);
                      }}
                    />
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full min-h-[44px]"
                      disabled={cooling.has(participant.id)}
                      onClick={() => handleApplyDamage(participant.id, displayName)}
                    >
                      Modificar Vida
                    </Button>
                  </div>

                  {displayType === 'player' && participant.hp_current <= 0 && (
                    <MasterDeathControls
                      characterId={participant.entity_id}
                      participantId={participant.id}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {dyingNotices.map((notice) => (
        <div
          key={notice.id}
          role="alert"
          className="flex items-center justify-between gap-3 rounded-md border border-red-700/50 bg-red-900/30 p-3 text-sm text-red-400"
        >
          <span>{notice.text}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDyingNotices((all) => all.filter((n) => n.id !== notice.id))}
          >
            Entendi
          </Button>
        </div>
      ))}

      <AttackLog attacks={attacks} abilityUses={abilityUses} />

      {selectedParticipant && (
        <HealthModificationModal
          isOpen={!!selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
          onApplied={() => startHealthCooldown(selectedParticipant.id)}
          participantId={selectedParticipant.id}
          participantName={selectedParticipant.name}
        />
      )}
    </div>
  );
}
