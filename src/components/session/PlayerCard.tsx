import React from 'react';
import type { PresenceState } from '@/hooks/useSupabasePresence';

interface PlayerCardProps {
  user: PresenceState;
  isClickable?: boolean;
  isSessionGM?: boolean;
  onClick?: (userId: string, e: React.MouseEvent) => void;
}

export function PlayerCard({ user, isClickable = false, isSessionGM = false, onClick }: PlayerCardProps) {
  const clickable = isClickable && !isSessionGM;

  return (
    <div
      onClick={(e) => {
        if (clickable && onClick) {
          e.stopPropagation();
          onClick(user.user_id, e);
        }
      }}
      className={`flex items-center gap-3 p-3 bg-stone-700 rounded-md border border-stone-600 transition-colors
        ${clickable ? 'cursor-pointer hover:bg-stone-600 hover:border-stone-500' : ''}
      `}
    >
      <div className="flex-1">
        <span className="text-stone-200 font-medium text-lg flex items-center gap-2">
          {user.name || 'Jogador'}
          {isSessionGM && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
              👑 Mestre
            </span>
          )}
        </span>
        <span className="text-xs text-stone-400 block mt-1">
          Online desde {new Date(user.online_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      {clickable && (
        <div className="text-stone-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </div>
      )}
    </div>
  );
}
