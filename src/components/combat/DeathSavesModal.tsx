import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useDeathSaves } from '../../hooks/useDeathSaves';

interface DeathSavesModalProps {
  character: any;
  participantId?: string;
}

export function DeathSavesModal({ character, participantId }: DeathSavesModalProps) {
  const { addSuccess, addFailure, healAndAwake } = useDeathSaves();
  const [manualRoll, setManualRoll] = useState('');
  const [isRolling, setIsRolling] = useState(false);

  if (!character) return null;

  const successes = character.death_saves_successes || 0;
  const failures = character.death_saves_failures || 0;
  const isStable = character.is_stable || false;
  const isDead = character.is_dead || false;

  const handleRollResult = async (roll: number) => {
    setIsRolling(true);
    try {
      if (roll === 1) {
        await addFailure(character.id, failures, 2);
      } else if (roll >= 2 && roll <= 9) {
        await addFailure(character.id, failures, 1);
      } else if (roll >= 10 && roll <= 19) {
        await addSuccess(character.id, successes);
      } else if (roll === 20) {
        await healAndAwake(character.id, participantId, 1);
      }
    } catch (e) {
      console.error('Failed to update death saves:', e);
    } finally {
      setIsRolling(false);
    }
  };

  const handleManualRoll = () => {
    const val = parseInt(manualRoll);
    if (!isNaN(val) && val >= 1 && val <= 20) {
      handleRollResult(val);
      setManualRoll('');
    }
  };

  const handleAutoRoll = () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    handleRollResult(roll);
  };

  if (isDead) {
    return (
      <Card className="border-destructive ring-2 ring-destructive ring-offset-2 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive text-center text-2xl uppercase tracking-widest">Você Morreu</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>Seu personagem não resistiu aos ferimentos.</p>
        </CardContent>
      </Card>
    );
  }

  if (isStable) {
    return (
      <Card className="border-green-500 ring-2 ring-green-500 ring-offset-2 bg-green-500/10">
        <CardHeader>
          <CardTitle className="text-green-500 text-center text-xl uppercase tracking-widest">Estável</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>Você estabilizou e não precisa mais realizar testes de morte, mas permanece inconsciente (0 PV).</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-500 ring-2 ring-orange-500 ring-offset-2 bg-orange-500/10">
      <CardHeader>
        <CardTitle className="text-orange-500 text-center text-2xl uppercase tracking-widest">Teste de Morte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
          {/* Sucessos */}
          <div className="flex flex-col items-center gap-2">
            <span className="font-bold text-lg text-green-500">Sucessos</span>
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={`s-${i}`} className={`w-8 h-8 rounded-full border-2 border-green-500 ${successes >= i ? 'bg-green-500' : 'bg-transparent'}`} />
              ))}
            </div>
          </div>

          {/* Falhas */}
          <div className="flex flex-col items-center gap-2">
            <span className="font-bold text-lg text-destructive">Falhas</span>
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={`f-${i}`} className={`w-8 h-8 rounded-full border-2 border-destructive ${failures >= i ? 'bg-destructive' : 'bg-transparent'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 pt-4 border-t border-orange-500/30">
          <p className="text-sm text-center text-muted-foreground">
            Role 1d20 no seu turno.
            <br />1 = 2 Falhas | 2-9 = 1 Falha | 10-19 = 1 Sucesso | 20 = 1 PV e Acorda
          </p>
          
          <div className="flex gap-4 w-full max-w-sm">
            <div className="flex-1 flex gap-2">
              <Input 
                type="number" 
                min="1" max="20" 
                placeholder="Valor 1-20"
                value={manualRoll}
                onChange={e => setManualRoll(e.target.value)}
                disabled={isRolling}
              />
              <Button onClick={handleManualRoll} disabled={isRolling || !manualRoll}>Confirmar</Button>
            </div>
            <div className="font-bold flex items-center">OU</div>
            <Button onClick={handleAutoRoll} disabled={isRolling} variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
              Rolar Auto
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
