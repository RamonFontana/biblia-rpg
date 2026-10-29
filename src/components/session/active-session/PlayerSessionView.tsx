import { useMemo, useState } from 'react';
import { BookOpen, Backpack, Moon, ScrollText, Users } from 'lucide-react';
import { SessionParticipantList } from '@/components/session/SessionParticipantList';
import { PlayerRestIndicator } from '@/components/session/PlayerRestIndicator';
import { ShortRestCard } from '@/components/session/ShortRestCard';
import { useShortRestRecharge } from '@/hooks/useShortRestRecharge';
import { PlayerStatusBar } from './PlayerStatusBar';
import { PlayerHotbar } from '@/components/session/hotbar/PlayerHotbar';
import { CharacterSheetView } from '@/components/character/CharacterSheetView';
import { PlayerCombatView } from '@/components/combat/PlayerCombatView';
import { DeathSavesModal } from '@/components/combat/DeathSavesModal';
import { AttackLog } from '@/components/combat/AttackLog';
import { DockPanel } from '@/components/ui/dock-panel';
import { DockRail, type DockItem } from './DockRail';
import { useCombatStore } from '@/store/combatStore';
import { getShortRestState } from '@/domain/shortRest';
import type { PresenceState } from '@/data-access/realtime';
import type {
  GameSession,
  SessionCharacter,
  SessionNpc,
  SessionPlayer,
} from '@/data-access/sessions';
import type { SessionTest, SessionTestResult } from '@/data-access/sessionTests';
import { getCurrentPv } from '@/domain/vitals';
import { buildCombatEntities } from '@/lib/combatEntities';
import type { TradeWithItems } from '@/types/trade';

type PlayerPanel = 'ficha' | 'inventario' | 'grupo' | 'historico' | 'descanso';

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
  /** Abre o diálogo de dados da tela. */
  onOpenDice: () => void;
}

/**
 * A visão do jogador, na moldura do ADR 0009: o Palco no centro e o trilho de Painéis na borda.
 * A Barra de Status e a Hotbar ainda são só o lugar delas (tickets 02 e 03); por ora a Inspiração
 * e o combate de hoje moram no Palco.
 */
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
  onOpenDice,
}: PlayerSessionViewProps) {
  // Cada celular recarrega o próprio personagem quando o Descanso Curto abre (ADR 0006).
  const rechargeTargets = useMemo(() => (myCharacter ? [myCharacter] : []), [myCharacter]);
  useShortRestRecharge(sessionData.short_rest_id, rechargeTargets, (id, patch) =>
    updateLocal('player', id, patch),
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

  const [panel, setPanel] = useState<PlayerPanel | null>(null);
  const { attacks, abilityUses, currentTurnParticipant } = useCombatStore();
  const entities = buildCombatEntities({ playerCharacters, npcs, enemies });
  const turn =
    hasActiveCombat && currentTurnParticipant
      ? {
          isMine: currentTurnParticipant.entity_id === myCharacter?.id,
          name: entities.find((e) => e.id === currentTurnParticipant.entity_id)?.name ?? 'Inimigo',
        }
      : null;

  const restState = getShortRestState(sessionData, hasActiveCombat);
  const dock: DockItem<PlayerPanel>[] = [
    { id: 'ficha', label: 'Ficha', icon: <BookOpen className="h-6 w-6" /> },
    { id: 'inventario', label: 'Inventário', icon: <Backpack className="h-6 w-6" /> },
    {
      id: 'grupo',
      label: 'Grupo',
      icon: <Users className="h-6 w-6" />,
      attention: activeTrades.some((t) => t.status === 'pending'),
    },
    { id: 'historico', label: 'Histórico', icon: <ScrollText className="h-6 w-6" /> },
    {
      id: 'descanso',
      label: 'Descanso',
      icon: <Moon className="h-6 w-6" />,
      attention: restState.isOpen || restState.refused,
    },
  ];
  const title = dock.find((d) => d.id === panel)?.label ?? '';

  return (
    <div className="relative flex min-h-[70vh] flex-col md:flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        <PlayerStatusBar
          character={myCharacter}
          sessionId={sessionId}
          day={sessionData.current_day || 1}
          period={sessionData.current_period || 'Manhã'}
          turn={turn}
          onOpenSheet={() => setPanel('ficha')}
          onInspirationUsed={(patch) => myCharacter && updateLocal('player', myCharacter.id, patch)}
        />
        <main aria-label="Palco" className="flex min-w-0 flex-1 flex-col gap-4 pr-16 md:pr-0">
          {myCharacter &&
            getCurrentPv(myCharacter.stats) <= 0 &&
            !myCharacter.is_dead &&
            !hasActiveCombat && <DeathSavesModal character={myCharacter} />}

          {hasActiveCombat && (
            <div className="w-full p-4 border border-red-500/50 bg-red-950/20 rounded-lg">
              <PlayerCombatView
                character={myCharacter}
                enemies={enemies}
                isLoading={isCharactersLoading}
                entities={entities}
                inspirationContext={{ sessionId, day: sessionData.current_day || 1 }}
                onInspirationUsed={
                  myCharacter ? (patch) => updateLocal('player', myCharacter.id, patch) : undefined
                }
              />
            </div>
          )}
        </main>
        <PlayerHotbar
          character={myCharacter}
          entities={entities}
          onCharacterPatch={(patch) => myCharacter && updateLocal('player', myCharacter.id, patch)}
          onOpenDice={onOpenDice}
        />
      </div>

      <DockRail items={dock} onOpen={setPanel} />

      <DockPanel
        open={panel !== null}
        onOpenChange={(open) => !open && setPanel(null)}
        title={title}
      >
        {(panel === 'ficha' || panel === 'inventario') && (
          <CharacterSheetView userId={userId} sessionId={sessionId} />
        )}
        {panel === 'grupo' && (
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
        )}
        {panel === 'historico' && <AttackLog attacks={attacks} abilityUses={abilityUses} />}
        {panel === 'descanso' && (
          <div className="space-y-4">
            <ShortRestCard
              role="player"
              sessionId={sessionId}
              session={sessionData}
              hasActiveCombat={hasActiveCombat}
              players={restPlayers}
              myCharacterId={myCharacter?.id}
              spenders={rechargeTargets}
              onSpent={(id, patch) => updateLocal('player', id, patch)}
            />
            <PlayerRestIndicator sessionData={sessionData} />
          </div>
        )}
      </DockPanel>
    </div>
  );
}
