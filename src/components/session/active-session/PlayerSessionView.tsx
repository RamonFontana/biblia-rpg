import { SessionParticipantList } from '@/components/session/SessionParticipantList';
import { PlayerRestIndicator } from '@/components/session/PlayerRestIndicator';
import { CharacterSheetView } from '@/components/character/CharacterSheetView';
import { PlayerCombatView } from '@/components/combat/PlayerCombatView';
import { DeathSavesModal } from '@/components/combat/DeathSavesModal';
import type { PresenceState } from '@/data-access/realtime';
import type {
  GameSession,
  SessionCharacter,
  SessionNpc,
  SessionPlayer,
} from '@/data-access/sessions';
import type { SessionTest, SessionTestResult } from '@/data-access/sessionTests';
import { getCurrentPv } from '@/domain/vitals';
import type { TradeWithItems } from '@/types/trade';

interface PlayerSessionViewProps {
  userId: string;
  sessionId: string;
  sessionData: GameSession;
  /** A ficha do jogador nesta sessão, se ele tem uma. */
  myCharacter: SessionPlayer['character'] | undefined;
  playerCharacters: SessionPlayer[];
  npcs: SessionNpc[];
  enemies: SessionCharacter[];
  isCharactersLoading: boolean;
  hasActiveCombat: boolean;
  onlineUsers: PresenceState[];
  activeTrades: TradeWithItems[];
  activeTests: SessionTest[];
  testResults: Record<string, SessionTestResult[]>;
  updateLocal: (
    kind: 'player' | 'npc' | 'enemy',
    id: string,
    patch: Record<string, unknown>,
  ) => void;
  onNegotiate: (targetUserId: string) => void;
  onNPCNegotiate: (npc: { id: string; name?: string; is_playable?: boolean }) => void;
  onAcceptTrade: (tradeId: string) => void;
  onRejectTrade: (tradeId: string) => void;
}

/** A visão do jogador: descanso, Testes de Morte, combate, a ficha e quem está na sessão. */
export function PlayerSessionView({
  userId,
  sessionId,
  sessionData,
  myCharacter,
  playerCharacters,
  npcs,
  enemies,
  isCharactersLoading,
  hasActiveCombat,
  onlineUsers,
  activeTrades,
  activeTests,
  testResults,
  updateLocal,
  onNegotiate,
  onNPCNegotiate,
  onAcceptTrade,
  onRejectTrade,
}: PlayerSessionViewProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="p-3 md:p-4 bg-stone-800/50 border border-stone-700 rounded-md mb-4 md:mb-6 max-w-md w-full text-center">
        <h2 className="text-amber-500 font-bold flex items-center justify-center gap-2">
          <span className="text-xl">⚔️</span> Visão do Jogador
        </h2>
        <p className="text-stone-400 text-sm mt-1">
          Você está conectado como jogador. Aguarde as instruções do Mestre.
        </p>
      </div>

      <PlayerRestIndicator sessionData={sessionData} character={myCharacter} />

      {myCharacter &&
        getCurrentPv(myCharacter.stats) <= 0 &&
        !myCharacter.is_dead &&
        !hasActiveCombat && (
          <div className="w-full max-w-4xl mt-4">
            <DeathSavesModal character={myCharacter} />
          </div>
        )}

      {hasActiveCombat && (
        <div className="w-full max-w-6xl mt-4 p-4 border border-red-500/50 bg-red-950/20 rounded-lg">
          <PlayerCombatView
            sessionId={sessionId}
            character={myCharacter}
            enemies={enemies}
            isLoading={isCharactersLoading}
          />
        </div>
      )}

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 w-full max-w-6xl mt-4">
        <div className="border border-stone-800 rounded-lg bg-stone-950 lg:col-span-2 w-full overflow-hidden">
          <CharacterSheetView userId={userId} sessionId={sessionId} />
        </div>

        <div className="border border-stone-800 rounded-lg p-3 md:p-4 bg-stone-950 w-full overflow-hidden">
          <h3 className="text-lg md:text-xl font-semibold mb-4 text-stone-200 text-center">
            Personagens na Sessão
          </h3>
          <SessionParticipantList
            onlineUsers={onlineUsers}
            isGM={false}
            sessionId={sessionId}
            gmId={sessionData.gm_id}
            playerCharacters={playerCharacters.filter(
              (pc) => !pc.character.is_deleted && !pc.character.is_npc && !pc.character.is_enemy,
            )}
            npcs={npcs.filter((n) => (n as unknown as { is_visible?: boolean }).is_visible)}
            activeTrades={activeTrades}
            onUpdatePlayerData={(characterId, patch) => updateLocal('player', characterId, patch)}
            onUpdateNPCData={(npcId, patch) => updateLocal('npc', npcId, patch)}
            onNegotiate={onNegotiate}
            onNPCNegotiate={onNPCNegotiate}
            onAcceptTrade={onAcceptTrade}
            onRejectTrade={onRejectTrade}
            activeTests={activeTests}
            testResults={testResults}
          />
        </div>
      </div>
    </div>
  );
}
