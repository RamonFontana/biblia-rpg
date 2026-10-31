import { useMemo, useState } from 'react';
import {
  Dices,
  Map as MapIcon,
  Moon,
  ScrollText,
  Skull,
  Sparkles,
  Swords,
  Users,
} from 'lucide-react';
import { SessionParticipantList } from '@/components/session/SessionParticipantList';
import { SessionNPCList } from '@/components/session/SessionNPCList';
import { SessionEnemyList } from '@/components/session/SessionEnemyList';
import { SessionRestControls } from '@/components/session/SessionRestControls';
import { ShortRestCard } from '@/components/session/ShortRestCard';
import { useShortRestRecharge } from '@/hooks/useShortRestRecharge';
import { RuptureAlert } from '@/components/session/RuptureAlert';
import { DyingAlert } from '@/components/session/DyingAlert';
import { Retratos } from '@/components/session/palco/Retratos';
import { MapaDoPalco } from '@/components/session/palco/MapaDoPalco';
import { MapsPanel } from '@/components/session/maps/MapsPanel';
import type { SessionMap } from '@/data-access/maps';
import { InitiativeStrip } from '@/components/session/palco/InitiativeStrip';
import { InitiativeList } from '@/components/session/palco/InitiativeList';
import { CombatDashboard } from '@/components/combat/CombatDashboard';
import { AttackLog } from '@/components/combat/AttackLog';
import { Button } from '@/components/ui/button';
import { DOCK_PANEL_GAP, DockPanel } from '@/components/ui/dock-panel';
import { useCombatStore } from '@/store/combatStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { buildRetratos, type Retrato } from '@/lib/retratos';
import { buildMapScene, pinTargetOf } from '@/lib/mapScene';
import { useMapPins } from '@/hooks/useMapPins';
import { getShortRestState } from '@/domain/shortRest';
import { DockRail, type DockItem } from './DockRail';
import { MasterBar } from './MasterBar';
import { PlayerHotbar } from '@/components/session/hotbar/PlayerHotbar';
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

type GmPanel = 'jogadores' | 'inimigos' | 'npcs' | 'mapas' | 'descanso' | 'historico' | 'sessao';

interface GmSessionViewProps {
  sessionId: string;
  /** Os mapas da sessão. */
  maps: SessionMap[];
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
  maps,
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
  // O mapa que o Mestre abriu só para si; os jogadores veem `shown_map_id`.
  const [preparedId, setPreparedId] = useState<string | null>(null);
  const shownMap = maps.find((m) => m.id === sessionData.shown_map_id) ?? null;
  const preparedMap = maps.find((m) => m.id === preparedId) ?? null;
  const stageMap = preparedMap ?? shownMap;
  // O NPC jogável que o Mestre conduz pela Hotbar da Barra: o do turno, ou o do seletor.
  const [actAs, setActAs] = useState<string | undefined>(undefined);
  const { activeCombat, attacks, abilityUses, currentTurnParticipant, participants } =
    useCombatStore();
  // A coluna fixa do Mestre só cabe a partir de `lg`; abaixo disso o combate fica no Palco.
  const wide = useMediaQuery('(min-width: 1024px)');
  // No celular, o combate vira a lista de iniciativa; o botão Cena alterna para os Retratos.
  const phone = useMediaQuery('(max-width: 767px)');
  const [scene, setScene] = useState(false);
  const [expanded, setExpanded] = useState<{ id: string | null; turn: string | undefined } | null>(
    null,
  );

  const retratos = buildRetratos({
    playerCharacters,
    npcs,
    enemies,
    myCharacterId: undefined,
    hasActiveCombat,
    participants,
    includeHiddenNpcs: true,
  });
  // O Mestre arruma os pins do mapa que está na tela dele (o preparado ou o mostrado).
  const { pins, move: movePin } = useMapPins(stageMap?.id);
  const mapScene = buildMapScene({
    playerCharacters,
    npcs,
    enemies,
    myCharacterId: undefined,
    hasActiveCombat,
    participants,
    pins,
    viewer: 'gm',
    turnEntityId: hasActiveCombat ? currentTurnParticipant?.entity_id : undefined,
  });
  const dying = retratos
    .filter((r) => r.kind === 'player' && r.down)
    .filter((r) => !playerCharacters.find((pc) => pc.character.id === r.id)?.character.is_dead)
    .map((r) => r.name);
  const initiative = participants.map((p) => {
    const retrato = retratos.find((r) => r.id === p.entity_id);
    return {
      id: p.entity_id,
      name: availableEntities.find((e) => e.id === p.entity_id)?.name ?? 'Inimigo',
      imageUrl: retrato?.imageUrl,
      isMe: false,
      down: p.hp_current <= 0,
    };
  });

  // O participante em foco acompanha o turno; escolher um Retrato o fixa até o turno mudar.
  const [focus, setFocus] = useState<{ id: string; turn: string | undefined } | null>(null);
  const turnId = currentTurnParticipant?.id;
  const focusId = focus && focus.turn === turnId ? focus.id : (turnId ?? participants[0]?.id);

  const turnNpc = hasActiveCombat
    ? playableNpcs.find((n) => n.id === currentTurnParticipant?.entity_id)
    : undefined;
  const actingNpc = turnNpc ?? playableNpcs.find((n) => n.id === actAs && !n.is_deleted);

  // A linha aberta acompanha o turno; tocar numa linha a abre ou fecha até o turno mudar.
  const expandedId =
    expanded && expanded.turn === turnId ? (expanded.id ?? undefined) : (turnId ?? undefined);
  const toggleRow = (id: string) =>
    setExpanded({ id: expandedId === id ? null : id, turn: turnId });
  const rows = participants.map((p) => {
    const retrato = retratos.find((r) => r.id === p.entity_id);
    return {
      id: p.id,
      name: availableEntities.find((e) => e.id === p.entity_id)?.name ?? 'Inimigo',
      kind: retrato?.kind ?? 'enemy',
      initiative: p.initiative,
      pv: p.hp_current,
      imageUrl: retrato?.imageUrl,
      down: p.hp_current <= 0,
    };
  });
  const combatList = phone && hasActiveCombat && !scene;

  const openRetrato = (retrato: Retrato) => {
    if (phone && hasActiveCombat && retrato.participantId) {
      setExpanded({ id: retrato.participantId, turn: turnId });
      setScene(false);
    } else if (wide && hasActiveCombat && retrato.participantId) {
      setFocus({ id: retrato.participantId, turn: turnId });
    } else {
      setPanel(
        retrato.kind === 'player' ? 'jogadores' : retrato.kind === 'npc' ? 'npcs' : 'inimigos',
      );
    }
  };

  // Fora do combate, a coluna já mostra os cartões dos jogadores: o Painel repetiria a lista.
  const columnShowsPlayers = wide && !hasActiveCombat;

  const restState = getShortRestState(sessionData, hasActiveCombat);
  const activeTest = activeTests.find((t) => t.status === 'active');
  const hasAnswers =
    !!activeTest && (testResults[activeTest.id] ?? []).some((r) => r.status === 'submitted');

  const participantList = (
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
  );

  const dock: DockItem<GmPanel | 'testes'>[] = [
    ...(columnShowsPlayers
      ? []
      : [{ id: 'jogadores' as const, label: 'Jogadores', icon: <Users className="h-6 w-6" /> }]),
    { id: 'inimigos', label: 'Inimigos', icon: <Skull className="h-6 w-6" /> },
    { id: 'npcs', label: 'NPCs', icon: <Sparkles className="h-6 w-6" /> },
    { id: 'mapas', label: 'Mapas', icon: <MapIcon className="h-6 w-6" /> },
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
          <DyingAlert names={dying} />

          {phone && hasActiveCombat && (
            <Button
              variant="outline"
              className="min-h-11 self-start"
              onClick={() => setScene((value) => !value)}
            >
              {scene ? 'Iniciativa' : 'Cena'}
            </Button>
          )}

          {combatList ? (
            <InitiativeList
              rows={rows}
              round={activeCombat?.round_number ?? 1}
              currentId={turnId}
              expandedId={expandedId}
              onToggle={toggleRow}
              renderExpanded={(id) => (
                <CombatDashboard availableEntities={availableEntities} focusId={id} />
              )}
            />
          ) : (
            <>
              {stageMap ? (
                <>
                  {preparedMap && preparedMap.id !== shownMap?.id && (
                    <p className="text-sm text-amber-400">
                      Em preparo: {preparedMap.name}. Os jogadores veem{' '}
                      {shownMap ? shownMap.name : 'os Retratos'}.
                    </p>
                  )}
                  <MapaDoPalco
                    map={stageMap}
                    scene={mapScene}
                    isGm
                    onOpenRetrato={openRetrato}
                    onMovePin={(retrato, cell) => movePin(pinTargetOf(retrato), cell)}
                  />
                </>
              ) : (
                <Retratos
                  turnId={hasActiveCombat ? currentTurnParticipant?.entity_id : undefined}
                  retratos={retratos}
                  onOpen={openRetrato}
                />
              )}
            </>
          )}

          {hasActiveCombat && !wide && !phone && (
            <div className="p-4 border border-red-500/50 bg-red-950/20 rounded-lg">
              <CombatDashboard availableEntities={availableEntities} />
            </div>
          )}
        </main>
        {sessionData.status === 'active' && (
          <div className="md:flex md:items-end">
            {actingNpc && (
              <div className="min-w-0 md:flex-1">
                <p className="px-3 pt-1 text-xs text-stone-400">Agindo como {actingNpc.name}</p>
                <PlayerHotbar
                  character={actingNpc}
                  entities={availableEntities}
                  onCharacterPatch={(patch) => updateLocal('npc', actingNpc.id, patch)}
                  onOpenDice={onOpenDice}
                  restOpen={!!sessionData.short_rest_id}
                  onOpenRest={() => setPanel('descanso')}
                />
              </div>
            )}
            <div className={actingNpc ? 'md:w-[26rem] md:shrink-0' : 'w-full'}>
              <MasterBar
                onOpenTest={onOpenTest}
                onOpenCombat={onOpenCombat}
                onAdvanceTime={onAdvanceTime}
                onOpenRest={() => setPanel('descanso')}
                onOpenDice={onOpenDice}
                npcs={playableNpcs
                  .filter((n) => !n.is_deleted)
                  .map((n) => ({ id: n.id, name: n.name || 'NPC' }))}
                actingAs={actingNpc?.id}
                actAsLocked={!!turnNpc}
                onActAs={setActAs}
                collapsible={phone}
              />
            </div>
          </div>
        )}
      </div>

      {wide && (
        <aside
          aria-label="Coluna do Mestre"
          className="w-[26rem] shrink-0 space-y-4 border-l border-stone-800 px-4"
        >
          {hasActiveCombat ? (
            <>
              <InitiativeStrip
                entries={initiative}
                currentId={currentTurnParticipant?.entity_id}
                round={activeCombat?.round_number ?? 1}
              />
              <div className="rounded-lg border border-red-500/50 bg-red-950/20 p-4">
                <CombatDashboard availableEntities={availableEntities} focusId={focusId} />
              </div>
            </>
          ) : (
            participantList
          )}
        </aside>
      )}

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
        {panel === 'jogadores' && !columnShowsPlayers && participantList}
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
        {panel === 'mapas' && (
          <MapsPanel
            sessionId={sessionId}
            maps={maps}
            shownMapId={sessionData.shown_map_id}
            preparedId={preparedId}
            onPrepare={setPreparedId}
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
