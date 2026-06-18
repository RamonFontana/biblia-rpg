import { Button } from '@/components/ui/button';
import type { TradeWithItems } from '@/types/trade';
import type { Character } from '@/features/character-management/types';

interface TradeRequestNotificationProps {
  trade: TradeWithItems;
  playerCharacters: { user_id: string; character: Character }[];
  npcName?: string;
  onAccept: (tradeId: string) => void;
  onReject: (tradeId: string) => void;
}

export function TradeRequestNotification({
  trade,
  playerCharacters,
  npcName,
  onAccept,
  onReject,
}: TradeRequestNotificationProps) {
  const initiatorChar = playerCharacters.find(
    (pc) => pc.character.id === trade.initiator_character_id
  )?.character;

  const getMessage = () => {
    if (trade.type === 'npc_trade') {
      const playerName = initiatorChar?.name ?? 'Um jogador';
      const npc = npcName ?? 'NPC';
      return (
        <>
          <strong className="text-stone-200">{playerName}</strong> quer negociar com{' '}
          <strong className="text-stone-200">{npc}</strong>
        </>
      );
    }

    const initiatorName = initiatorChar?.name ?? 'Um jogador';
    return (
      <>
        <strong className="text-stone-200">{initiatorName}</strong> quer negociar com você
      </>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-stone-900 border border-amber-500/30 rounded-lg shadow-xl p-4 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚖️</span>
        <div className="flex-1">
          <h4 className="font-semibold text-amber-400 text-sm">Solicitação de Troca</h4>
          <p className="text-sm text-stone-400 mt-1">{getMessage()}</p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => onAccept(trade.id)}
              className="bg-green-600 hover:bg-green-500 text-white"
            >
              Aceitar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(trade.id)}
              className="border-stone-600 text-stone-300 hover:bg-stone-800"
            >
              Recusar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
