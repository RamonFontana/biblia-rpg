import { useState } from 'react';
import { useCombatStore } from '../../store/combatStore';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { HealthModificationModal } from './HealthModificationModal';
import { MasterDeathControls } from './MasterDeathControls';

interface CombatDashboardProps {
  sessionId: string;
  availableEntities?: { 
    id: string, 
    name: string, 
    type: 'player' | 'npc' | 'enemy', 
    hpCurrent: number,
    totalAc?: number,
    weapon?: { name: string, damageDie: string } 
  }[];
}

export function CombatDashboard({ sessionId: _sessionId, availableEntities = [] }: CombatDashboardProps) {
  const { 
    activeCombat, 
    participants, 
    currentTurnParticipant, 
    nextTurn,
    endCombat
  } = useCombatStore();

  const [selectedParticipant, setSelectedParticipant] = useState<{ id: string, name: string } | null>(null);

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
        <h2 className="text-2xl font-bold tracking-tight truncate">Painel de Combate (Rodada {activeCombat.round_number})</h2>
        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <Button variant="destructive" onClick={endCombat} className="flex-1 sm:flex-none">Finalizar Combate</Button>
          <Button onClick={nextTurn} className="flex-1 sm:flex-none">Próximo Turno</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {participants.map((participant) => {
          const isCurrentTurn = currentTurnParticipant?.id === participant.id;
          const entityDetails = availableEntities.find(e => e.id === participant.entity_id);
          const displayName = entityDetails ? entityDetails.name : `${participant.entity_type} (Init: ${participant.initiative})`;
          const displayType = entityDetails ? entityDetails.type : participant.entity_type;
          
          return (
            <Card key={participant.id} className={isCurrentTurn ? 'border-primary ring-2 ring-primary ring-offset-2' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-start text-lg gap-2">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate" title={displayName}>{displayName}</span>
                    <span className="text-xs text-muted-foreground capitalize mt-1 font-normal truncate">
                      {displayType === 'player' ? 'Personagem' : displayType === 'enemy' ? 'Inimigo' : 'NPC'} • Init: {participant.initiative}
                    </span>
                  </div>
                  {isCurrentTurn && <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full whitespace-nowrap ml-2">Turno Atual</span>}
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
                      <span className="font-bold text-blue-400">{entityDetails.totalAc}</span>
                    </div>
                  )}

                  {displayType === 'enemy' && entityDetails?.weapon && (
                    <div className="flex justify-between items-center mt-2 p-2 bg-stone-900 rounded border border-stone-800">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Arma:</span>
                        <span className="text-sm font-semibold text-amber-500">{entityDetails.weapon.name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground">Dano:</span>
                        <span className="text-sm font-bold">{entityDetails.weapon.damageDie}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {/* Condições mock, em app real pegar de participant.conditions */}
                    {Array.isArray(participant.conditions) && participant.conditions.map((cond, i) => (
                      <span key={i} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                        {cond as string}
                      </span>
                    ))}
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full min-h-[44px]"
                      onClick={() => handleApplyDamage(participant.id, displayName)}
                    >
                      Modificar Vida
                    </Button>
                  </div>
                  
                  {displayType === 'player' && participant.hp_current <= 0 && (
                    <MasterDeathControls characterId={participant.entity_id} participantId={participant.id} />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedParticipant && (
        <HealthModificationModal
          isOpen={!!selectedParticipant}
          onClose={() => setSelectedParticipant(null)}
          participantId={selectedParticipant.id}
          participantName={selectedParticipant.name}
        />
      )}
    </div>
  );
}
