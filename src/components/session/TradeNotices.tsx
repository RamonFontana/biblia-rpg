// Os avisos de troca por cima da tela: o pedido que chegou (Aceitar ou Recusar) e o que a própria
// pessoa fez (Cancelar pedido). Ficam fora de qualquer Painel (ADR 0009).
import type { Character } from '@/features/character-management/types';
import type { TradeWithItems } from '@/types/trade';
import { TradePendingNotice } from './TradePendingNotice';
import { TradeRequestNotification } from './TradeRequestNotification';

interface TradeNoticesProps {
  forUser: TradeWithItems[];
  fromUser: TradeWithItems[];
  playerCharacters: { user_id: string; character: Character }[];
  npcName: (trade: TradeWithItems) => string | undefined;
  targetName: (trade: TradeWithItems) => string | undefined;
  onAccept?: (tradeId: string) => void;
  onReject?: (tradeId: string) => void;
}

export function TradeNotices({
  forUser,
  fromUser,
  playerCharacters,
  npcName,
  targetName,
  onAccept,
  onReject,
}: TradeNoticesProps) {
  if (forUser.length === 0 && fromUser.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse items-end gap-3 max-w-[calc(100vw-2rem)]">
      {forUser.map((trade) => (
        <TradeRequestNotification
          key={trade.id}
          trade={trade}
          playerCharacters={playerCharacters}
          npcName={npcName(trade)}
          onAccept={(id) => onAccept?.(id)}
          onReject={(id) => onReject?.(id)}
        />
      ))}
      {fromUser.map((trade) => (
        <TradePendingNotice
          key={trade.id}
          trade={trade}
          targetName={targetName(trade)}
          onCancel={(id) => onReject?.(id)}
        />
      ))}
    </div>
  );
}
