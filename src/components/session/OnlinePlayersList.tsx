import React from 'react';
import type { PresenceState } from '@/hooks/useSupabasePresence';

interface OnlinePlayersListProps {
  onlineUsers: PresenceState[];
}

export function OnlinePlayersList({ onlineUsers }: OnlinePlayersListProps) {
  return (
    <div className="bg-stone-800 p-4 rounded-lg border border-stone-700 shadow-md">
      <h3 className="text-xl font-bold text-stone-200 mb-4 border-b border-stone-600 pb-2 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
        Jogadores Online ({onlineUsers.length})
      </h3>
      {onlineUsers.length === 0 ? (
        <p className="text-stone-400 text-sm">Nenhum jogador conectado no momento.</p>
      ) : (
        <ul className="space-y-2">
          {onlineUsers.map((user) => (
            <li
              key={user.user_id}
              className="flex items-center gap-2 p-2 bg-stone-700 rounded-md"
            >
              <div>
                <span className="text-stone-200 font-medium">
                  {user.name || 'Jogador'}
                </span>
                <span className="text-xs text-stone-400 block">
                  Desde {new Date(user.online_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
