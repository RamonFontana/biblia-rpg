import { useState } from 'react';
import type { PresenceState } from '@/hooks/useSupabasePresence';
import { PlayerCard } from './PlayerCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CharacterSheetView } from '../character/CharacterSheetView';
import { TokenContextMenu } from './TokenContextMenu';
import { TradeRequestNotification } from './TradeRequestNotification';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type { Character } from '@/features/character-management/types';
import type { TradeWithItems } from '@/types/trade';
import { CharacterAvatar } from '../ui/CharacterAvatar';
import { ConditionBadge } from '../conditions/ConditionBadge';
import { ConditionSelector } from '../conditions/ConditionSelector';
import { conditionsService } from '@/services/conditionsService';
import { characterVitalsService } from '@/services/characterVitalsService';
import { getCurrentPv } from '@/domain/vitals';
import type { ConditionEntry } from '@/types/combat';
import { addFaith } from '@/domain/faith';

interface SessionParticipantListProps {
  onlineUsers: PresenceState[];
  isGM?: boolean;
  sessionId?: string;
  gmId?: string;
  playerCharacters?: { user_id: string; character: Character }[];
  npcs?: Character[];
  activeTrades?: TradeWithItems[];
  onUpdatePlayerData?: (characterId: string, data: any) => void;
  onUpdateNPCData?: (npcId: string, data: any) => void;
  onNegotiate?: (targetUserId: string) => void;
  onShop?: (targetUserId: string) => void;
  onNPCNegotiate?: (npc: Character & { is_playable?: boolean }) => void;
  onAcceptTrade?: (tradeId: string) => void;
  onRejectTrade?: (tradeId: string) => void;
  activeTests: any[];
  testResults: Record<string, any[]>;
}

export function SessionParticipantList({
  onlineUsers,
  isGM = false,
  sessionId,
  gmId,
  playerCharacters = [],
  npcs = [],
  activeTrades = [],
  onUpdatePlayerData,
  onUpdateNPCData,
  onNegotiate,
  onShop,
  onNPCNegotiate,
  onAcceptTrade,
  onRejectTrade,
  activeTests,
  testResults,
}: SessionParticipantListProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedNPC, setSelectedNPC] = useState<Character | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const { user } = useAuthStore();

  const isCharacterTrading = (characterId: string | undefined) => {
    if (!characterId) return false;
    return activeTrades.some(
      (t) =>
        (t.status === 'active' || t.status === 'pending') &&
        (t.initiator_character_id === characterId || t.target_character_id === characterId),
    );
  };

  const pendingTradesForUser = activeTrades.filter((t) => {
    if (t.status !== 'pending') return false;
    if (t.type === 'player_trade') {
      const targetUser = playerCharacters.find((pc) => pc.character.id === t.target_character_id);
      return targetUser?.user_id === user?.id;
    }
    if (t.type === 'npc_trade' && isGM) {
      return true;
    }
    return false;
  });

  const handlePlayerClick = (userId: string, e?: React.MouseEvent) => {
    const char = playerCharacters.find((pc) => pc.user_id === userId)?.character;
    if (isCharacterTrading(char?.id)) return;

    if (userId !== gmId) {
      if (user && userId === user.id && e) {
        setContextMenuPos({ x: e.clientX, y: e.clientY });
      } else {
        setSelectedUserId(userId);
      }
    }
  };

  const closeSheet = () => setSelectedUserId(null);
  const closeNPCSheet = () => setSelectedNPC(null);
  const closeContextMenu = () => setContextMenuPos(null);

  const updatePlayerStat = async (
    character: Character,
    statKey: 'current_pv' | 'current_faith',
    delta: number,
  ) => {
    if (!character.stats) return;

    if (statKey === 'current_pv') {
      try {
        const newStats = await characterVitalsService.adjustCurrentPv(
          character.id,
          character.stats,
          delta,
        );
        if (onUpdatePlayerData) onUpdatePlayerData(character.id, { stats: newStats });
      } catch (e) {
        console.error('Erro ao atualizar status do Jogador:', e);
      }
      return;
    }

    const newValue = addFaith(character.stats, delta);

    const newStats = { ...character.stats, current_faith: newValue };

    try {
      await supabase.from('characters').update({ stats: newStats }).eq('id', character.id);

      if (onUpdatePlayerData) {
        onUpdatePlayerData(character.id, { stats: newStats });
      }
    } catch (e) {
      console.error('Erro ao atualizar status do Jogador:', e);
    }
  };

  const handleAddNPCCondition = async (npcId: string, conditionId: string, duration: number) => {
    const npc = npcs.find((n) => n.id === npcId);
    if (!npc) return;
    const current = ((npc as any).conditions as unknown as ConditionEntry[]) || [];
    const newCond: ConditionEntry = { conditionId, duration: duration > 0 ? duration : null };

    const updated = [...current.filter((c) => c.conditionId !== conditionId), newCond];
    if (onUpdateNPCData) onUpdateNPCData(npcId, { conditions: updated });

    await conditionsService.applyToCharacter(npcId, current, newCond);
  };

  const handleRemoveNPCCondition = async (npcId: string, conditionId: string) => {
    const npc = npcs.find((n) => n.id === npcId);
    if (!npc) return;
    const current = ((npc as any).conditions as unknown as ConditionEntry[]) || [];

    const updated = current.filter((c) => c.conditionId !== conditionId);
    if (onUpdateNPCData) onUpdateNPCData(npcId, { conditions: updated });

    await conditionsService.removeFromCharacter(npcId, current, conditionId);
  };

  const gmUser = onlineUsers.find((u) => u.user_id === gmId);
  const playerUsers = onlineUsers.filter((u) => u.user_id !== gmId);

  return (
    <>
      <div className="bg-stone-800 p-3 md:p-4 rounded-lg border border-stone-700 shadow-md">
        <h3 className="text-xl font-bold text-stone-200 mb-4 border-b border-stone-600 pb-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
          Participantes Online ({onlineUsers.length})
        </h3>

        {gmUser && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-stone-400 mb-3 uppercase tracking-wider">
              Mestre
            </h4>
            <PlayerCard user={gmUser} isClickable={false} isSessionGM={true} viewerIsGM={isGM} />
          </div>
        )}

        {(!isGM || playerUsers.length > 0) && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-stone-400 mb-3 uppercase tracking-wider">
              Personagens
            </h4>
            {playerUsers.length === 0 ? (
              <p className="text-stone-500 text-sm italic">Nenhum jogador conectado.</p>
            ) : (
              <ul className="space-y-3">
                {playerUsers.map((pUser) => {
                  const isBusy = activeTests.some(
                    (test) =>
                      test.status === 'active' &&
                      testResults[test.id]?.some(
                        (r) => r.player_id === pUser.user_id && r.status === 'pending',
                      ),
                  );
                  const associatedCharacter = playerCharacters.find(
                    (pc) => pc.user_id === pUser.user_id,
                  )?.character;
                  const trading = isCharacterTrading(associatedCharacter?.id);
                  const blocked = isBusy || trading;

                  return (
                    <li key={pUser.user_id}>
                      <PlayerCard
                        user={pUser}
                        isClickable={!blocked}
                        isSessionGM={false}
                        isBusy={isBusy}
                        isTrading={trading}
                        character={associatedCharacter}
                        viewerIsGM={isGM}
                        onUpdateStat={
                          associatedCharacter
                            ? (statKey, delta) =>
                                updatePlayerStat(associatedCharacter, statKey, delta)
                            : undefined
                        }
                        onUpdateConditions={
                          associatedCharacter && onUpdatePlayerData
                            ? (charId, conditions) => onUpdatePlayerData(charId, { conditions })
                            : undefined
                        }
                        onClick={blocked ? undefined : (id, e) => handlePlayerClick(id, e)}
                        onNegotiate={
                          !blocked && onNegotiate && pUser.user_id !== user?.id
                            ? onNegotiate
                            : undefined
                        }
                        onShop={!blocked && onShop ? onShop : undefined}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {npcs.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-stone-400 mb-3 uppercase tracking-wider">
              NPCs
            </h4>
            <ul className="space-y-3">
              {npcs.map((npc) => (
                <li key={npc.id}>
                  <div
                    className={`relative p-3 bg-stone-700 border border-stone-600 rounded-md transition-colors ${(npc as any).is_playable ? 'cursor-pointer hover:bg-stone-600' : ''}`}
                    onClick={() => {
                      if ((npc as any).is_playable) setSelectedNPC(npc);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <CharacterAvatar
                        imageUrl={npc.narrative?.imageUrl}
                        name={npc.name || 'NPC'}
                        className="w-10 h-10 border border-stone-600 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-between gap-2 mb-1">
                          <p
                            className="font-semibold text-stone-200 truncate min-w-0 max-w-[70%] sm:max-w-none"
                            title={npc.name}
                          >
                            {npc.name}
                          </p>
                          {!isGM && onNPCNegotiate && (npc as any).is_visible !== false && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNPCNegotiate(npc as Character & { is_playable?: boolean });
                              }}
                              className="h-7 text-xs border-stone-500 text-stone-300 hover:bg-stone-600 shrink-0"
                            >
                              ⚖️ Negociar
                            </Button>
                          )}
                        </div>
                        <p
                          className={`text-sm ${(npc as any).is_playable ? 'text-stone-400' : 'text-stone-500 line-clamp-2'}`}
                        >
                          {(npc as any).is_playable
                            ? `${npc.tribe || 'Tribo Desconhecida'} • ${npc.vocation || 'Sem Vocação'} (Nível ${npc.level || (npc.stats as any)?.level || 1})`
                            : npc.vocation}
                        </p>
                      </div>
                    </div>
                    {npc.stats && (
                      <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 pt-2 border-t border-stone-600/50 text-xs text-stone-400">
                        <div className="flex items-center gap-1">
                          <span className="text-red-400">♥</span>
                          <span>
                            {getCurrentPv(npc.stats)}/{npc.stats.pv}
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Condições do NPC */}
                    {(((npc as any).conditions as unknown as ConditionEntry[])?.length > 0 ||
                      isGM) && (
                      <div
                        className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-600/50 pt-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {(((npc as any).conditions as unknown as ConditionEntry[]) || []).map(
                          (cond) => (
                            <ConditionBadge
                              key={cond.conditionId}
                              conditionId={cond.conditionId}
                              duration={cond.duration || undefined}
                              onRemove={
                                isGM
                                  ? () => handleRemoveNPCCondition(npc.id, cond.conditionId)
                                  : undefined
                              }
                              readonly={!isGM}
                            />
                          ),
                        )}
                        {isGM && (
                          <ConditionSelector
                            onAddCondition={(cId, dur) => handleAddNPCCondition(npc.id, cId, dur)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {pendingTradesForUser.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse items-end gap-3 max-w-[calc(100vw-2rem)]">
          {pendingTradesForUser.map((trade) => {
            const npcName = trade.target_npc_id
              ? npcs.find((n) => n.id === trade.target_npc_id)?.name
              : trade.target_character_id
                ? npcs.find((n) => n.id === trade.target_character_id)?.name
                : undefined;
            return (
              <TradeRequestNotification
                key={trade.id}
                trade={trade}
                playerCharacters={playerCharacters}
                npcName={npcName}
                onAccept={(id) => onAcceptTrade?.(id)}
                onReject={(id) => onRejectTrade?.(id)}
              />
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedUserId} onOpenChange={(open: boolean) => !open && closeSheet()}>
        <DialogContent className="w-full sm:max-w-4xl bg-stone-950 border border-stone-800 p-0 text-stone-200 overflow-hidden flex flex-col gap-0">
          <DialogHeader className="p-6 border-b border-stone-800 bg-stone-900">
            <DialogTitle className="text-stone-100">Ficha do Personagem</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(100vh-150px)]">
            {selectedUserId && sessionId && (
              <CharacterSheetView userId={selectedUserId} sessionId={sessionId} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedNPC} onOpenChange={(open: boolean) => !open && closeNPCSheet()}>
        <DialogContent className="w-full sm:max-w-4xl bg-stone-950 border border-stone-800 p-0 text-stone-200 overflow-hidden flex flex-col gap-0">
          <DialogHeader className="p-6 border-b border-stone-800 bg-stone-900">
            <DialogTitle className="text-stone-100">Ficha do NPC: {selectedNPC?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(100vh-150px)]">
            {selectedNPC && (
              <CharacterSheetView characterId={selectedNPC.id} sessionId={sessionId} isGM={false} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {contextMenuPos && user && sessionId && (
        <TokenContextMenu
          userId={user.id}
          sessionId={sessionId}
          x={contextMenuPos.x}
          y={contextMenuPos.y}
          onClose={closeContextMenu}
        />
      )}
    </>
  );
}
