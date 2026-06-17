import React, { useState } from 'react';
import type { PresenceState } from '@/hooks/useSupabasePresence';
import { PlayerCard } from './PlayerCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CharacterSheetView } from '../character/CharacterSheetView';
import { TokenContextMenu } from './TokenContextMenu';
import { useAuthStore } from '@/store/authStore';
import { useSessionTests } from '@/hooks/useSessionTests';
import { supabase } from '@/lib/supabase';
import type { Character } from '@/features/character-management/types';

interface OnlinePlayersListProps {
  onlineUsers: PresenceState[];
  isGM?: boolean;
  sessionId?: string;
  gmId?: string;
  playerCharacters?: { user_id: string; character: Character }[];
  onUpdatePlayerStat?: (characterId: string, stats: any) => void;
}

export function OnlinePlayersList({ onlineUsers, isGM = false, sessionId, gmId, playerCharacters = [], onUpdatePlayerStat }: OnlinePlayersListProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const { user } = useAuthStore();
  const { activeTests, testResults } = useSessionTests(sessionId || '');

  const handlePlayerClick = (userId: string, e?: React.MouseEvent) => {
    if (userId !== gmId) {
      if (user && userId === user.id && e) {
        // Clicked on self, open context menu
        setContextMenuPos({ x: e.clientX, y: e.clientY });
      } else {
        // Clicked on someone else, open character sheet
        setSelectedUserId(userId);
      }
    }
  };

  const closeSheet = () => setSelectedUserId(null);
  const closeContextMenu = () => setContextMenuPos(null);

  const updatePlayerStat = async (character: Character, statKey: 'current_pv' | 'current_faith', delta: number) => {
    if (!character.stats) return;

    const baseKey = statKey === 'current_pv' ? 'pv' : 'faith';
    // PV máximo é o pv do personagem; Fé máxima é sempre 100
    const maxValue = statKey === 'current_pv'
      ? (character.stats[baseKey] || 10)
      : 100;
    const currentValue = character.stats[statKey] ?? character.stats[baseKey] ?? (statKey === 'current_pv' ? 10 : 0);
    
    let newValue = Math.max(0, currentValue + delta);
    if (newValue > maxValue) newValue = maxValue;

    const newStats = { ...character.stats, [statKey]: newValue };

    try {
      await supabase
        .from('characters')
        .update({ stats: newStats })
        .eq('id', character.id);
        
      if (onUpdatePlayerStat) {
        onUpdatePlayerStat(character.id, newStats);
      }
    } catch (e) {
      console.error('Erro ao atualizar status do Jogador:', e);
    }
  };

  const usersToList = isGM ? onlineUsers.filter(u => u.user_id !== gmId) : onlineUsers;

  return (
    <>
      <div className="bg-stone-800 p-4 rounded-lg border border-stone-700 shadow-md">
        <h3 className="text-xl font-bold text-stone-200 mb-4 border-b border-stone-600 pb-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
          Jogadores Online ({usersToList.length})
        </h3>
        {usersToList.length === 0 ? (
          <p className="text-stone-400 text-sm">Nenhum jogador conectado no momento.</p>
        ) : (
          <ul className="space-y-3">
            {usersToList.map((user) => {
              const isBusy = activeTests.some(test => 
                test.status === 'active' && 
                testResults[test.id]?.some(r => r.player_id === user.user_id && r.status === 'pending')
              )
              
              const associatedCharacter = playerCharacters.find(pc => pc.user_id === user.user_id)?.character;
              
              return (
                <li key={user.user_id}>
                  <PlayerCard
                    user={user}
                    isClickable={user.user_id !== gmId}
                    isSessionGM={user.user_id === gmId}
                    isBusy={isBusy}
                    character={associatedCharacter}
                    viewerIsGM={isGM}
                    onUpdateStat={associatedCharacter ? (statKey, delta) => updatePlayerStat(associatedCharacter, statKey, delta) : undefined}
                    onClick={(id, e) => handlePlayerClick(id, e)}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Dialog open={!!selectedUserId} onOpenChange={(open: boolean) => !open && closeSheet()}>
        <DialogContent className="w-full sm:max-w-4xl bg-stone-950 border border-stone-800 p-0 text-stone-200 overflow-hidden flex flex-col gap-0">
          <DialogHeader className="p-6 border-b border-stone-800 bg-stone-900">
            <DialogTitle className="text-stone-100">Ficha do Jogador</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(100vh-150px)]">
            {selectedUserId && sessionId && (
              <CharacterSheetView userId={selectedUserId} sessionId={sessionId} />
            )}
            {selectedUserId && !sessionId && (
              <div className="text-red-400 p-6">Erro: ID da sessão não fornecido.</div>
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
