import { Button } from '@/components/ui/button';
import type { TradeWithItems } from '@/types/trade';

interface TradePendingNoticeProps {
  trade: TradeWithItems;
  targetName?: string;
  onCancel: (tradeId: string) => void;
}

/** O pedido de Troca que a própria pessoa fez, enquanto o outro lado não responde. */
export function TradePendingNotice({ trade, targetName, onCancel }: TradePendingNoticeProps) {
  const message =
    trade.type === 'npc_trade' ? (
      <>
        Aguardando o Mestre aceitar a troca com{' '}
        <strong className="text-stone-200">{targetName ?? 'o NPC'}</strong>
      </>
    ) : (
      <>
        Você quer negociar com{' '}
        <strong className="text-stone-200">{targetName ?? 'outro jogador'}</strong>. Aguardando
        resposta
      </>
    );

  return (
    <div className="w-full max-w-sm bg-stone-900 border border-amber-500/30 rounded-lg shadow-xl p-4 animate-in slide-in-from-bottom-4 pointer-events-auto">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚖️</span>
        <div className="flex-1">
          <h4 className="font-semibold text-amber-400 text-sm">Pedido de Troca enviado</h4>
          <p className="text-sm text-stone-400 mt-1">{message}</p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancel(trade.id)}
              className="border-stone-600 text-stone-300 hover:bg-stone-800"
            >
              Cancelar pedido
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
