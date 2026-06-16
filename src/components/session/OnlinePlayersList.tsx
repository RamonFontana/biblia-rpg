import React, { useState } from 'react';
import type { PresenceState } from '@/hooks/useSupabasePresence';
import { PlayerCard } from './PlayerCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CharacterSheetView } from '../character/CharacterSheetView';

interface OnlinePlayersListProps {
  onlineUsers: PresenceState[];
  isGM?: boolean;
  sessionId?: string;
  gmId?: string;
}

export function OnlinePlayersList({ onlineUsers, isGM = false, sessionId, gmId }: OnlinePlayersListProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handlePlayerClick = (userId: string) => {
    if (userId !== gmId) {
      setSelectedUserId(userId);
    }
  };

  const closeSheet = () => setSelectedUserId(null);

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
            {usersToList.map((user) => (
              <li key={user.user_id}>
                <PlayerCard
                  user={user}
                  isClickable={user.user_id !== gmId}
                  isSessionGM={user.user_id === gmId}
                  onClick={handlePlayerClick}
                />
              </li>
            ))}
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
    </>
  );
}
