import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TradeSide } from './TradeSide';
import type { TradeWithItems, TradeType } from '@/types/trade';
import { tradeService } from '@/services/tradeService';
import type { Character } from '@/features/character-management/types';

interface TradeDialogProps {
  trade: TradeWithItems;
  isOpen: boolean;
  currentUserId: string;
  isGM: boolean;
  playerCharacters: { user_id: string; character: Character }[];
  npcName?: string;
  onClose: () => void;
  onTradeUpdated: () => void;
}

function getTradeTitle(type: TradeType): string {
  switch (type) {
    case 'shop':
      return 'Lojinha do Mestre';
    case 'npc_trade':
      return 'Negociação com NPC';
    default:
      return 'Negociação';
  }
}

export function TradeDialog({
  trade,
  isOpen,
  currentUserId,
  isGM,
  playerCharacters,
  npcName,
  onClose,
  onTradeUpdated,
}: TradeDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  const initiatorChar = playerCharacters.find(
    (pc) => pc.character.id === trade.initiator_character_id
  )?.character;
  const targetChar = playerCharacters.find(
    (pc) => pc.character.id === trade.target_character_id
  )?.character;

  const initiatorLabel =
    trade.type === 'shop'
      ? 'Mestre (Lojinha)'
      : initiatorChar?.name ?? 'Iniciador';

  const targetLabel =
    trade.type === 'npc_trade' && trade.target_npc_id && !trade.target_character_id
      ? npcName ?? 'NPC'
      : targetChar?.name ?? 'Alvo';

  const userControlsInitiator =
    trade.type === 'shop' ? isGM : trade.initiator_user_id === currentUserId;

  const targetUserId = playerCharacters.find(
    (pc) => pc.character.id === trade.target_character_id
  )?.user_id;

  const userControlsTarget =
    trade.type === 'shop'
      ? targetUserId === currentUserId
      : trade.type === 'npc_trade'
        ? isGM
        : targetUserId === currentUserId;

  useEffect(() => {
    if (
      trade.initiator_ready &&
      trade.target_ready &&
      trade.status === 'active' &&
      !executing
    ) {
      handleExecute();
    }
  }, [trade.initiator_ready, trade.target_ready, trade.status, executing]);

  const handleExecute = async () => {
    if (executing) return;
    setExecuting(true);
    setError(null);
    try {
      const result = await tradeService.executeTrade(trade.id);
      if (!result.success) {
        setError(result.error ?? 'Erro ao executar a transação.');
        await tradeService.setReady(trade.id, 'initiator', false);
        await tradeService.setReady(trade.id, 'target', false);
        onTradeUpdated();
      } else {
        onTradeUpdated();
        onClose();
      }
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao executar a transação.');
    } finally {
      setExecuting(false);
    }
  };

  const handleCancel = async () => {
    try {
      await tradeService.cancelTrade(trade.id);
      onTradeUpdated();
      onClose();
    } catch (e) {
      console.error('Erro ao cancelar negociação:', e);
    }
  };

  const handleReady = async (side: 'initiator' | 'target', ready: boolean) => {
    try {
      await tradeService.setReady(trade.id, side, ready);
      onTradeUpdated();
    } catch (e) {
      console.error('Erro ao marcar pronto:', e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full sm:max-w-4xl max-h-[95vh] overflow-y-auto bg-stone-950 border border-stone-800 text-stone-200">
        <DialogHeader>
          <DialogTitle className="text-stone-100 flex items-center gap-2">
            {trade.type === 'shop' && <span>🏪</span>}
            {trade.type === 'npc_trade' && <span>⚖️</span>}
            {getTradeTitle(trade.type)}
          </DialogTitle>
          <p className="text-sm text-stone-400">
            {initiatorLabel} ↔ {targetLabel}
          </p>
        </DialogHeader>

        {executing && (
          <div className="text-center text-amber-400 text-sm animate-pulse py-2">
            Executando transação...
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4">
          <TradeSide
            label={initiatorLabel}
            side="initiator"
            tradeId={trade.id}
            coins={trade.initiator_coins}
            tradeItems={trade.trade_items}
            isReady={trade.initiator_ready}
            otherSideReady={trade.target_ready}
            canEdit={userControlsInitiator && trade.status === 'active'}
            useCatalog={trade.type === 'shop'}
            skipBalanceCheck={trade.type === 'shop'}
            characterId={trade.initiator_character_id}
            characterCoins={initiatorChar?.coins ?? 0}
            onCoinsChange={() => onTradeUpdated()}
            onReady={(ready) => handleReady('initiator', ready)}
            onItemsChanged={onTradeUpdated}
          />

          <div className="hidden md:flex items-center justify-center text-stone-500 text-2xl">⇄</div>

          <TradeSide
            label={targetLabel}
            side="target"
            tradeId={trade.id}
            coins={trade.target_coins}
            tradeItems={trade.trade_items}
            isReady={trade.target_ready}
            otherSideReady={trade.initiator_ready}
            canEdit={userControlsTarget && trade.status === 'active'}
            useCatalog={
              trade.type === 'npc_trade' && isGM && !!trade.target_npc_id && !trade.target_character_id
            }
            skipBalanceCheck={
              trade.type === 'npc_trade' && isGM && !!trade.target_npc_id && !trade.target_character_id
            }
            characterId={trade.target_character_id}
            characterCoins={targetChar?.coins ?? 0}
            onCoinsChange={() => onTradeUpdated()}
            onReady={(ready) => handleReady('target', ready)}
            onItemsChanged={onTradeUpdated}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-stone-800">
          <Button variant="outline" onClick={handleCancel} className="border-stone-600 text-stone-300">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
