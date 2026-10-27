import { SessionParticipantList } from '@/components/session/SessionParticipantList';
import { SessionNPCList } from '@/components/session/SessionNPCList';
import { SessionEnemyList } from '@/components/session/SessionEnemyList';
import { useMemo } from 'react';
import { SessionRestControls } from '@/components/session/SessionRestControls';
import { ShortRestCard } from '@/components/session/ShortRestCard';
import { useShortRestRecharge } from '@/hooks/useShortRestRecharge';
import { RuptureAlert } from '@/components/session/RuptureAlert';
import { CombatDashboard } from '@/components/combat/CombatDashboard';
import type { PresenceState } from '@/data-access/realtime';
import type {
  GameSession,
  SessionCharacter,
  SessionNpc,
  SessionPlayer,
} from '@/data-access/sessions';
import type { SessionTest, SessionTestResult } from '@/data-access/sessionTests';
import type { buildCombatEntities } from '@/lib/combatEntities';
import type { TradeWithItems } from '@/types/trade';

interface GmSessionViewProps {
  sessionId: string;
  sessionData: GameSession;
  playerCharacters: SessionPlayer[];
  npcs: SessionNpc[];
  enemies: SessionCharacter[];
  isCharactersLoading: boolean;
  hasActiveCombat: boolean;
  availableEntities: ReturnType<typeof buildCombatEntities>;
  onlineUsers: PresenceState[];
  activeTrades: TradeWithItems[];
  activeTests: SessionTest[];
  testResults: Record<string, SessionTestResult[]>;
  updateLocal: (
    kind: 'player' | 'npc' | 'enemy',
    id: string,
    patch: Record<string, unknown>,
  ) => void;
  onShop: (targetUserId: string) => void;
  onAcceptTrade: (tradeId: string) => void;
  onRejectTrade: (tradeId: string) => void;
  onNPCNegotiate: (npc: { id: string; name?: string; is_playable?: boolean }) => void;
}

/** A visão do Mestre: descanso, combate, jogadores, inimigos e NPCs. */
export function GmSessionView({
  sessionId,
  sessionData,
  playerCharacters,
  npcs,
  enemies,
  isCharactersLoading,
  hasActiveCombat,
  availableEntities,
  onlineUsers,
  activeTrades,
  activeTests,
  testResults,
  updateLocal,
  onShop,
  onAcceptTrade,
  onRejectTrade,
  onNPCNegotiate,
}: GmSessionViewProps) {
  // Os NPCs jogáveis têm ficha: o Mestre recarrega as Habilidades deles no Descanso Curto (ADR 0006).
  const playableNpcs = useMemo(() => npcs.filter((n) => n.is_playable && !n.is_enemy), [npcs]);
  useShortRestRecharge(sessionData.short_rest_id, playableNpcs, (id, patch) =>
    updateLocal('npc', id, patch),
  );

  // Quem conta no "todos" do Pedido de Descanso: o personagem de cada jogador (ADR 0006).
  const restPlayers = useMemo(
    () =>
      playerCharacters.map((pc) => ({
        id: pc.character.id,
        name: pc.character.name ?? 'Jogador',
        is_dead: pc.character.is_dead,
      })),
    [playerCharacters],
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="p-3 md:p-4 bg-amber-900/20 border border-amber-700/50 rounded-md mb-4 md:mb-6">
        <h2 className="text-amber-500 font-bold flex items-center gap-2">
          <span className="text-xl">👑</span> Visão do Mestre
        </h2>
        <p className="text-amber-200/70 text-sm mt-1">
          Você é o mestre desta sessão. Aqui você gerencia os inimigos, NPCs e a narrativa.
        </p>
      </div>

      <RuptureAlert players={playerCharacters} />

      <ShortRestCard
        role="master"
        sessionId={sessionId}
        session={sessionData}
        hasActiveCombat={hasActiveCombat}
        players={restPlayers}
        spenders={playableNpcs}
        onSpent={(id, patch) => updateLocal('npc', id, patch)}
      />

      <SessionRestControls
        sessionId={sessionId}
        sessionData={sessionData}
        playerCharacters={playerCharacters}
        npcs={npcs}
      />

      {hasActiveCombat && (
        <div className="mb-6 p-4 border border-red-500/50 bg-red-950/20 rounded-lg">
          <CombatDashboard availableEntities={availableEntities} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SessionParticipantList
          onlineUsers={onlineUsers}
          isGM
          sessionId={sessionId}
          currentDay={sessionData.current_day || 1}
          gmId={sessionData.gm_id}
          playerCharacters={playerCharacters.filter(
            (pc) => !pc.character.is_deleted && !pc.character.is_npc && !pc.character.is_enemy,
          )}
          tradeNpcs={npcs}
          activeTrades={activeTrades}
          onUpdatePlayerData={(characterId, patch) => updateLocal('player', characterId, patch)}
          onUpdateNPCData={(npcId, patch) => updateLocal('npc', npcId, patch)}
          onShop={onShop}
          onAcceptTrade={onAcceptTrade}
          onRejectTrade={onRejectTrade}
          activeTests={activeTests}
          testResults={testResults}
        />
        <SessionEnemyList
          sessionId={sessionId}
          enemies={enemies}
          isLoading={isCharactersLoading}
          updateLocalEnemy={(enemyId, patch) => updateLocal('enemy', enemyId, patch)}
        />

        <SessionNPCList
          npcs={npcs}
          sessionId={sessionId}
          onUpdateNPCData={(npcId, patch) => updateLocal('npc', npcId, patch)}
          onNPCNegotiate={onNPCNegotiate}
        />
      </div>
    </div>
  );
}
