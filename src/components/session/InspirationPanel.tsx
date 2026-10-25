import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { markInspirationUsed } from '@/data-access/characters';
import { getInspirationStatus } from '@/domain/inspiration';
import type { Character } from '@/features/character-management/types';
import { Button } from '@/components/ui/button';

interface InspirationPanelProps {
  character: Character;
  sessionId: string;
  /** O dia atual da sessão. */
  day: number;
  /** Avisa a tela do dia gravado, para o painel e o cartão do Mestre mudarem já. */
  onUsed: (patch: { inspiration_used_day: number; inspiration_session_id: string }) => void;
}

/**
 * A Inspiração do Inabalável (uma por dia da sessão). O botão "Usei a Inspiração" a marca para uma
 * rolagem fora dos Testes do app; no Teste do app ela é gasta pelo próprio diálogo.
 */
export function InspirationPanel({ character, sessionId, day, onUsed }: InspirationPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [isMarking, setIsMarking] = useState(false);

  const status = getInspirationStatus({
    stats: character.stats,
    usedDay: character.inspiration_used_day,
    usedSessionId: character.inspiration_session_id,
    sessionId,
    day,
  });
  if (!status) return null;

  const handleUse = async () => {
    setError(null);
    setIsMarking(true);
    try {
      await markInspirationUsed(character.id, sessionId, day);
      onUsed({ inspiration_used_day: day, inspiration_session_id: sessionId });
    } catch (e) {
      console.error('Error marking the Inspiration as used:', e);
      setError('Não foi possível marcar a Inspiração. Tente de novo.');
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-md border border-green-700/50 bg-green-900/30 px-3 py-2 text-sm text-green-400">
      <span className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        {status === 'disponivel' ? 'Inspiração disponível' : 'Inspiração usada hoje'}
      </span>
      {status === 'disponivel' && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isMarking}
          onClick={handleUse}
          className="h-8 border-green-700/50 px-2.5 text-xs text-green-400 hover:bg-green-900/50"
        >
          Usei a Inspiração
        </Button>
      )}
      {error && <span className="basis-full text-xs text-red-400">{error}</span>}
    </div>
  );
}
