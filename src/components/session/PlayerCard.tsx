import React from 'react';
import type { PresenceState } from '@/hooks/useSupabasePresence';
import type { Character } from '@/features/character-management/types';
import { Button } from '@/components/ui/button';
import { Heart, LogIn, Minus, Plus, Scale, Shield, Sparkles, Store } from 'lucide-react';
import { MasterDeathControls } from '../combat/MasterDeathControls';

interface PlayerCardProps {
  user: PresenceState;
  isClickable?: boolean;
  isSessionGM?: boolean;
  isBusy?: boolean;
  isTrading?: boolean;
  character?: Character | null;
  viewerIsGM?: boolean;
  onUpdateStat?: (statKey: 'current_pv' | 'current_faith', delta: number) => void;
  onClick?: (userId: string, e: React.MouseEvent) => void;
  onNegotiate?: (userId: string) => void;
  onShop?: (userId: string) => void;
}

export function PlayerCard({
  user,
  isClickable = false,
  isSessionGM = false,
  isBusy = false,
  isTrading = false,
  character,
  viewerIsGM = false,
  onUpdateStat,
  onClick,
  onNegotiate,
  onShop,
}: PlayerCardProps) {
  const blocked = isBusy || isTrading;
  const clickable = isClickable && !isSessionGM && !blocked;
  const canOpenShop = viewerIsGM && !isSessionGM && onShop && !blocked;
  const canNegotiate = !isSessionGM && !viewerIsGM && onNegotiate && character && !blocked;
  const hasActions = canOpenShop || canNegotiate || clickable;

  return (
    <div
      onClick={(e) => {
        if (clickable && onClick) {
          e.stopPropagation();
          onClick(user.user_id, e);
        }
      }}
      className={`group min-w-0 rounded-md border border-stone-600 bg-stone-700 p-3 transition-colors
        ${clickable ? 'cursor-pointer hover:bg-stone-600 hover:border-stone-500' : ''}
        ${blocked ? 'opacity-75' : ''}
      `}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="min-w-0 truncate text-lg font-medium text-stone-200">
              {character ? character.name : (user.name || 'Jogador')}
            </span>
            {isSessionGM && (
              <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                👑 Mestre
              </span>
            )}
            {isBusy && !isSessionGM && (
              <span className="flex animate-pulse items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                🎲 Testando...
              </span>
            )}
            {isTrading && !isSessionGM && (
              <span className="flex animate-pulse items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">
                ⚖️ Negociando...
              </span>
            )}
          </div>
          <span className="mt-1 block truncate text-xs text-stone-400">
            {character ? `Jogador: ${user.name || 'Desconhecido'} • ` : ''}Online desde {new Date(user.online_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {hasActions && (
          <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
            {canOpenShop && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); onShop(user.user_id); }}
                className="h-8 whitespace-nowrap border-amber-600/50 px-2.5 text-xs text-amber-400 hover:bg-amber-600/20"
              >
                <Store className="mr-1 h-3.5 w-3.5" />
                Lojinha
              </Button>
            )}
            {canNegotiate && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); onNegotiate(user.user_id); }}
                className="h-8 whitespace-nowrap border-stone-500 px-2.5 text-xs text-stone-300 hover:bg-stone-600"
              >
                <Scale className="mr-1 h-3.5 w-3.5" />
                Negociar
              </Button>
            )}
            {clickable && (
              <LogIn
                className="h-5 w-5 text-stone-400 transition-colors group-hover:text-stone-200"
                aria-hidden="true"
              />
            )}
          </div>
        )}
      </div>

      {character && character.stats && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-600/50 pt-2 text-xs text-stone-400">
          <div className={`flex h-7 items-center gap-1.5 ${viewerIsGM ? 'rounded bg-stone-800 px-2' : ''}`}>
            <Heart className="h-3.5 w-3.5 text-red-400" />
            {viewerIsGM && onUpdateStat ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Reduzir PV"
                  onClick={(e) => { e.stopPropagation(); onUpdateStat('current_pv', -1); }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-stone-700 hover:bg-stone-600"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="min-w-[3.25rem] text-center font-mono tabular-nums">
                  {character.stats.current_pv ?? character.stats.pv}/{character.stats.pv}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar PV"
                  onClick={(e) => { e.stopPropagation(); onUpdateStat('current_pv', 1); }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-stone-700 hover:bg-stone-600"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <span className="font-mono tabular-nums">{character.stats.current_pv ?? character.stats.pv}/{character.stats.pv}</span>
            )}
          </div>
          <div className={`flex h-7 items-center gap-1.5 ${viewerIsGM ? 'rounded bg-stone-800 px-2' : ''}`}>
            <Shield className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-mono tabular-nums">CA {character.stats.ca}</span>
          </div>
          <div className={`flex h-7 items-center gap-1.5 ${viewerIsGM ? 'rounded bg-stone-800 px-2' : ''}`}>
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            {viewerIsGM && onUpdateStat ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Reduzir Fé"
                  onClick={(e) => { e.stopPropagation(); onUpdateStat('current_faith', -1); }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-stone-700 hover:bg-stone-600"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="min-w-[3.25rem] text-center font-mono tabular-nums">
                  {character.stats.current_faith ?? character.stats.faith}/100
                </span>
                <button
                  type="button"
                  aria-label="Aumentar Fé"
                  onClick={(e) => { e.stopPropagation(); onUpdateStat('current_faith', 1); }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-stone-700 hover:bg-stone-600"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <span className="font-mono tabular-nums">{character.stats.current_faith ?? character.stats.faith}/100</span>
            )}
          </div>
        </div>
      )}

      {viewerIsGM && character && (((character.stats?.current_pv ?? character.stats?.pv ?? 1) <= 0) || character.is_dead || character.is_stable) && (
        <div className="mt-3 border-t border-stone-600/50 pt-2" onClick={(e) => e.stopPropagation()}>
          <MasterDeathControls characterId={character.id} />
        </div>
      )}
    </div>
  );
}
