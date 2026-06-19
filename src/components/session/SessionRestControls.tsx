import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Coffee, Moon, Loader2 } from 'lucide-react';

interface SessionRestControlsProps {
  sessionId: string;
  sessionData: any;
  playerCharacters: any[];
  npcs?: any[];
  onRestCompleted?: () => void;
}

export function SessionRestControls({ sessionId, sessionData, playerCharacters, npcs = [], onRestCompleted }: SessionRestControlsProps) {
  const [isResting, setIsResting] = useState(false);

  if (!sessionData) return null;

  const shortRestsTaken = sessionData.short_rests_today || 0;
  const currentDay = sessionData.current_day || 1;
  const lastLongRestDay = sessionData.last_long_rest_day || 1;

  const canShortRest = shortRestsTaken < 2;
  const canLongRest = (currentDay - lastLongRestDay) >= 2;

  const handleShortRest = async () => {
    if (!canShortRest || isResting) return;

    const amountStr = window.prompt("Quantidade de PV recuperada para todos os personagens no Descanso Curto (deixe em branco para 0):");
    if (amountStr === null) return; // User cancelled

    const amount = parseInt(amountStr || '0', 10);
    if (isNaN(amount) || amount < 0) {
      alert("Valor inválido.");
      return;
    }

    setIsResting(true);

    try {
      // 1. Update session tracking
      const { error: sessionError } = await supabase
        .from('game_sessions')
        .update({ short_rests_today: shortRestsTaken + 1 })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;
      
      // 2. Update characters if amount > 0
      if (amount > 0) {
        const allCharacters = [
          ...playerCharacters.filter(pc => pc.character && !pc.character.is_enemy).map(pc => pc.character),
          ...npcs.filter(npc => !npc.is_enemy)
        ];

        const updates = allCharacters.map(char => {
          const currentStats = char.stats || {};
          const maxPv = currentStats.pv || 10;
          const currentPv = currentStats.current_pv ?? maxPv;
          
          const newPv = Math.min(maxPv, currentPv + amount);

          return supabase
            .from('characters')
            .update({
              stats: {
                ...currentStats,
                current_pv: newPv,
              }
            })
            .eq('id', char.id);
        });

        await Promise.all(updates);
        if (onRestCompleted) onRestCompleted();
      }

      alert(`Descanso Curto concluído! Todos recuperaram ${amount} PV.`);
    } catch (error) {
      console.error('Erro ao acionar descanso curto:', error);
      alert('Erro ao iniciar descanso curto.');
    } finally {
      setIsResting(false);
    }
  };

  const handleLongRest = async () => {
    if (!canLongRest || isResting) return;
    setIsResting(true);

    try {
      // 1. Update session tracking
      const { error: sessionError } = await supabase
        .from('game_sessions')
        .update({ 
          last_long_rest_day: currentDay,
          short_rests_today: 0 // Reset short rests just in case
        })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // 2. Check if there's a Priest for the Faith bonus
      const hasPriest = playerCharacters.some(pc => 
        pc.character?.vocation?.includes('Sacerdote') || pc.character?.vocation?.includes('Sábio')
      );
      
      const baseFaithRoll = Math.floor(Math.random() * 4) + 1; // 1d4
      const faithRecovered = hasPriest ? baseFaithRoll + 2 : baseFaithRoll;

      // 3. Update all characters (players and npcs)
      const allCharacters = [
        ...playerCharacters.filter(pc => pc.character && !pc.character.is_enemy).map(pc => pc.character),
        ...npcs.filter(npc => !npc.is_enemy)
      ];

      const updates = allCharacters.map(char => {
        const currentStats = char.stats || {};
        const maxPv = currentStats.pv || 10;
        const maxFaith = 100;
        const currentFaith = currentStats.current_faith ?? currentStats.faith ?? 0;

        const newFaith = Math.min(maxFaith, currentFaith + faithRecovered);

        return supabase
          .from('characters')
          .update({
            stats: {
              ...currentStats,
              current_pv: maxPv,
              current_faith: newFaith,
            }
          })
          .eq('id', char.id);
      });

      await Promise.all(updates);
      if (onRestCompleted) onRestCompleted();

      alert(`Descanso Longo concluído! Todos os personagens recuperaram toda a vida, habilidades e fé. O grupo recuperou ${faithRecovered} de Fé.`);
    } catch (error) {
      console.error('Erro ao acionar descanso longo:', error);
      alert('Erro ao realizar descanso longo.');
    } finally {
      setIsResting(false);
    }
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-lg p-4 mb-6 shadow-sm">
      <h3 className="text-lg font-semibold text-stone-200 mb-3 border-b border-stone-800 pb-2">Controles de Descanso</h3>
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={handleShortRest}
          disabled={!canShortRest || isResting}
          variant="outline"
          className="bg-emerald-900/20 text-emerald-500 border-emerald-800 hover:bg-emerald-900/40 hover:text-emerald-400"
        >
          {isResting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Coffee className="w-4 h-4 mr-2" />}
          Descanso Curto ({2 - shortRestsTaken} restantes)
        </Button>

        <Button
          onClick={handleLongRest}
          disabled={!canLongRest || isResting}
          variant="outline"
          className="bg-indigo-900/20 text-indigo-400 border-indigo-800 hover:bg-indigo-900/40 hover:text-indigo-300"
          title={!canLongRest ? "Necessário aguardar 2 dias de jogo." : ""}
        >
          {isResting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Moon className="w-4 h-4 mr-2" />}
          Descanso Longo {canLongRest ? "(Disponível)" : "(Indisponível)"}
        </Button>
      </div>
      {!canLongRest && (
        <p className="text-xs text-stone-500 mt-2">
          Descanso longo estará disponível a partir do dia {lastLongRestDay + 2}.
        </p>
      )}
    </div>
  );
}
