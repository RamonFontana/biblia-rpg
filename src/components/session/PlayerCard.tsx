import React from 'react';
import type { PresenceState } from '@/hooks/useSupabasePresence';

import type { Character } from '@/features/character-management/types';

interface PlayerCardProps {
  user: PresenceState;
  isClickable?: boolean;
  isSessionGM?: boolean;
  isBusy?: boolean;
  character?: Character | null;
  viewerIsGM?: boolean;
  onUpdateStat?: (statKey: 'current_pv' | 'current_faith', delta: number) => void;
  onClick?: (userId: string, e: React.MouseEvent) => void;
}

export function PlayerCard({ user, isClickable = false, isSessionGM = false, isBusy = false, character, viewerIsGM = false, onUpdateStat, onClick }: PlayerCardProps) {
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
          {character ? character.name : (user.name || 'Jogador')}
          {isSessionGM && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
              👑 Mestre
            </span>
          )}
          {isBusy && !isSessionGM && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1 animate-pulse">
              🎲 Testando...
            </span>
          )}
        </span>
        <span className="text-xs text-stone-400 block mt-1">
          {character ? `Jogador: ${user.name || 'Desconhecido'} • ` : ''}Online desde {new Date(user.online_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {character && character.stats && (
          <div className="flex gap-4 mt-2 pt-2 border-t border-stone-600/50 text-xs text-stone-400">
            <div className={`flex items-center gap-1 ${viewerIsGM ? 'bg-stone-800 px-2 py-1 rounded' : ''}`}>
              <span className="text-red-400">♥</span>
              {viewerIsGM && onUpdateStat ? (
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); onUpdateStat('current_pv', -1); }} className="w-5 h-5 bg-stone-700 hover:bg-stone-600 rounded flex items-center justify-center">-</button>
                  <span className="w-8 text-center font-mono">{character.stats.current_pv ?? character.stats.pv}/{character.stats.pv}</span>
                  <button onClick={(e) => { e.stopPropagation(); onUpdateStat('current_pv', 1); }} className="w-5 h-5 bg-stone-700 hover:bg-stone-600 rounded flex items-center justify-center">+</button>
                </div>
              ) : (
                <span>{character.stats.current_pv ?? character.stats.pv}/{character.stats.pv}</span>
              )}
            </div>
            <div className={`flex items-center gap-1 ${viewerIsGM ? 'bg-stone-800 px-2 py-1 rounded' : ''}`}>
              <span className="text-blue-400">⛨</span>
              <span className="font-mono">CA {character.stats.ca}</span>
            </div>
            <div className={`flex items-center gap-1 ${viewerIsGM ? 'bg-stone-800 px-2 py-1 rounded' : ''}`}>
              <span className="text-amber-400">✨</span>
              {viewerIsGM && onUpdateStat ? (
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); onUpdateStat('current_faith', -1); }} className="w-5 h-5 bg-stone-700 hover:bg-stone-600 rounded flex items-center justify-center">-</button>
                  <span className="w-8 text-center font-mono">{character.stats.current_faith ?? character.stats.faith}/100</span>
                  <button onClick={(e) => { e.stopPropagation(); onUpdateStat('current_faith', 1); }} className="w-5 h-5 bg-stone-700 hover:bg-stone-600 rounded flex items-center justify-center">+</button>
                </div>
              ) : (
                <span>{character.stats.current_faith ?? character.stats.faith}/100</span>
              )}
            </div>
          </div>
        )}
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
