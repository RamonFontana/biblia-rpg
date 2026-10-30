import { useMemo, useState } from 'react';
import { Dices, Moon, ScrollText, Skull, Sparkles, Swords, Users } from 'lucide-react';
import { SessionParticipantList } from '@/components/session/SessionParticipantList';
import { SessionNPCList } from '@/components/session/SessionNPCList';
import { SessionEnemyList } from '@/components/session/SessionEnemyList';
import { SessionRestControls } from '@/components/session/SessionRestControls';
import { ShortRestCard } from '@/components/session/ShortRestCard';
import { useShortRestRecharge } from '@/hooks/useShortRestRecharge';
import { RuptureAlert } from '@/components/session/RuptureAlert';
import { CombatDashboard } from '@/components/combat/CombatDashboard';
import { AttackLog } from '@/components/combat/AttackLog';
import { Button } from '@/components/ui/button';
import { DOCK_PANEL_GAP, DockPanel } from '@/components/ui/dock-panel';
import { useCombatStore } from '@/store/combatStore';
import { getShortRestState } from '@/domain/shortRest';
import { DockRail, type DockItem } from './DockRail';
import { MasterBar } from './MasterBar';
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

type GmPanel = 'jogadores' | 'inimigos' | 'npcs' | 'descanso' | 'historico' | 'sessao';

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
  onOpenTest: () => void;
  onOpenCombat: () => void;
  onAdvanceTime: () => void;
  onOpenDice: () => void;
  onOpenEndSession: () => void;
}

/**
 * A visão do Mestre, na mesma moldura do jogador (ADR 0009): o Palco no centro, o trilho de Painéis
 * na borda e a Barra do Mestre embaixo. Os componentes de hoje moram nos Painéis, sem mudança.
 */
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
  onOpenTest,
  onOpenCombat,
  onAdvanceTime,
  onOpenDice,
  onOpenEndSession,
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

  const [panel, setPanel] = useState<GmPanel | null>(null);
  const { attacks, abilityUses } = useCombatStore();

  const restState = getShortRestState(sessionData, hasActiveCombat);
  const activeTest = activeTests.find((t) => t.status === 'active');
  const hasAnswers =
    !!activeTest && (testResults[activeTest.id] ?? []).some((r) => r.status === 'submitted');

  const dock: DockItem<GmPanel | 'testes'>[] = [
    { id: 'jogadores', label: 'Jogadores', icon: <Users className="h-6 w-6" /> },
    { id: 'inimigos', label: 'Inimigos', icon: <Skull className="h-6 w-6" /> },
    { id: 'npcs', label: 'NPCs', icon: <Sparkles className="h-6 w-6" /> },
    // O Teste já tem a janela própria do Mestre; o ícone abre essa janela.
    { id: 'testes', label: 'Testes', icon: <Dices className="h-6 w-6" />, attention: hasAnswers },
    {
      id: 'descanso',
      label: 'Descanso',
      icon: <Moon className="h-6 w-6" />,
      attention: restState.isOpen,
    },
    { id: 'historico', label: 'Histórico', icon: <ScrollText className="h-6 w-6" /> },
    { id: 'sessao', label: 'Sessão', icon: <Swords className="h-6 w-6" /> },
  ];
  const title = dock.find((d) => d.id === panel)?.label ?? '';

  return (
    <div
      data-testid="moldura-da-sessao"
      className={`relative flex min-h-[70vh] flex-col md:flex-row ${panel !== null ? DOCK_PANEL_GAP : ''}`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <main aria-label="Palco" className="flex min-w-0 flex-1 flex-col gap-4 pr-16 md:pr-0">
          <RuptureAlert players={playerCharacters} />

          {hasActiveCombat ? (
            <div className="p-4 border border-red-500/50 bg-red-950/20 rounded-lg">
              <CombatDashboard availableEntities={availableEntities} />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-stone-500">
              Abra um Painel no trilho para gerenciar a mesa.
            </p>
          )}
        </main>
        {sessionData.status === 'active' && (
          <MasterBar
            onOpenTest={onOpenTest}
            onOpenCombat={onOpenCombat}
            onAdvanceTime={onAdvanceTime}
            onOpenRest={() => setPanel('descanso')}
            onOpenDice={onOpenDice}
          />
        )}
      </div>

      <DockRail
        items={dock}
        onOpen={(id) => {
          if (id === 'testes') onOpenTest();
          else setPanel(id);
        }}
      />

      <DockPanel
        open={panel !== null}
        onOpenChange={(open) => !open && setPanel(null)}
        title={title}
      >
        {panel === 'jogadores' && (
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
        )}
        {panel === 'inimigos' && (
          <SessionEnemyList
            sessionId={sessionId}
            enemies={enemies}
            isLoading={isCharactersLoading}
            updateLocalEnemy={(enemyId, patch) => updateLocal('enemy', enemyId, patch)}
          />
        )}
        {panel === 'npcs' && (
          <SessionNPCList
            npcs={npcs}
            sessionId={sessionId}
            onUpdateNPCData={(npcId, patch) => updateLocal('npc', npcId, patch)}
            onNPCNegotiate={onNPCNegotiate}
          />
        )}
        {panel === 'descanso' && (
          <div className="space-y-4">
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
          </div>
        )}
        {panel === 'historico' && <AttackLog attacks={attacks} abilityUses={abilityUses} />}
        {panel === 'sessao' && (
          <div className="space-y-3">
            <p className="text-sm text-stone-400">
              Finalizar a sessão encerra a mesa para todos e abre a subida de nível.
            </p>
            <Button variant="destructive" className="min-h-11" onClick={onOpenEndSession}>
              Finalizar Sessão
            </Button>
          </div>
        )}
      </DockPanel>
    </div>
  );
}
