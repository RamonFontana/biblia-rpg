
import { useCombatStore } from '../../store/combatStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { PhysicalRollForm } from './PhysicalRollForm';

import { DeathSavesModal } from './DeathSavesModal';

interface PlayerCombatViewProps {
  sessionId: string;
  character: any; // The current player character data
}

export function PlayerCombatView({ sessionId: _sessionId, character }: PlayerCombatViewProps) {
  const playerId = character?.id;
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

  if (!activeCombat) {
    return (
      <div className="p-4 border rounded-md text-center bg-muted/50">
        <p className="text-muted-foreground">Aguardando início do combate...</p>
      </div>
    );
  }

  const isMyTurn = currentTurnParticipant?.entity_id === playerId;
  const participant = participants.find(p => p.entity_id === playerId);
  const isDying = participant && participant.hp_current <= 0;

  return (
    <div className="space-y-6">
      {isDying && (
        <DeathSavesModal character={character} participantId={participant.id} />
      )}

      {isMyTurn && !isDying && (
        <div className="bg-primary/20 border-2 border-primary rounded-lg p-6 text-center animate-in fade-in zoom-in flex flex-col items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-primary uppercase tracking-widest">É O SEU TURNO!</h2>
            <p className="text-muted-foreground mt-2">Escolha suas ações com sabedoria.</p>
          </div>
          <Button size="lg" onClick={() => useCombatStore.getState().nextTurn()} className="w-full sm:w-auto font-bold">
            Encerrar Meu Turno
          </Button>
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

      <PhysicalRollForm playerId={playerId} character={character} />
    </div>
  );
}
