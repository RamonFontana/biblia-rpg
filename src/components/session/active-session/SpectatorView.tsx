import { useState } from 'react';
import { BookOpen, Users } from 'lucide-react';
import { CharacterSheetView } from '@/components/character/CharacterSheetView';
import { SessionParticipantList } from '@/components/session/SessionParticipantList';
import { Retratos } from '@/components/session/palco/Retratos';
import { MapaDoPalco } from '@/components/session/palco/MapaDoPalco';
import type { SessionMap } from '@/data-access/maps';
import { InitiativeStrip } from '@/components/session/palco/InitiativeStrip';
import { CombatFeed } from '@/components/session/palco/CombatFeed';
import { RetratoCard } from '@/components/session/palco/RetratoCard';
import { DOCK_PANEL_GAP, DockPanel } from '@/components/ui/dock-panel';
import { buildRetratos } from '@/lib/retratos';
import { buildMapScene } from '@/lib/mapScene';
import { useMapPins } from '@/hooks/useMapPins';
import { buildCombatEntities } from '@/lib/combatEntities';
import { useCombatStore } from '@/store/combatStore';
import { DockRail, type DockItem } from './DockRail';
import type { PresenceState } from '@/data-access/realtime';
import type {
  GameSession,
  SessionCharacter,
  SessionNpc,
  SessionPlayer,
} from '@/data-access/sessions';
import type { SessionTest, SessionTestResult } from '@/data-access/sessionTests';
import type { TradeWithItems } from '@/types/trade';

type SpectatorPanel = 'ficha' | 'grupo';

interface SpectatorViewProps {
  userId: string;
  /** O Mapa atual, quando o Mestre mostrou um. */
  shownMap: SessionMap | null;
  sessionId: string;
  sessionData: GameSession;
  playerCharacters: SessionPlayer[];
  npcs: SessionNpc[];
  enemies: SessionCharacter[];
  hasActiveCombat: boolean;
  onlineUsers: PresenceState[];
  activeTrades: TradeWithItems[];
  activeTests: SessionTest[];
  testResults: Record<string, SessionTestResult[]>;
}

/**
 * Quem teve a ficha excluída só acompanha a sessão, na mesma moldura (ADR 0009) e só para leitura:
 * o Palco com os Retratos, a iniciativa e o feed no combate, e um trilho com a Ficha apagada e o
 * Grupo. Não há Hotbar nem ação nenhuma.
 */
export function SpectatorView({
  userId,
  shownMap,
  sessionId,
  sessionData,
  playerCharacters,
  npcs,
  enemies,
  hasActiveCombat,
  onlineUsers,
  activeTrades,
  activeTests,
  testResults,
}: SpectatorViewProps) {
  const [panel, setPanel] = useState<SpectatorPanel | null>(null);
  const [retratoId, setRetratoId] = useState<string | null>(null);
  const { activeCombat, attacks, abilityUses, currentTurnParticipant, participants } =
    useCombatStore();

  const retratos = buildRetratos({
    playerCharacters,
    npcs,
    enemies,
    myCharacterId: undefined,
    hasActiveCombat,
    participants,
  });
  const { pins } = useMapPins(shownMap?.id);
  const scene = buildMapScene({
    playerCharacters,
    npcs,
    enemies,
    myCharacterId: undefined,
    hasActiveCombat,
    participants,
    pins,
    viewer: 'spectator',
    turnEntityId: hasActiveCombat ? currentTurnParticipant?.entity_id : undefined,
  });
  const openRetrato =
    retratos.find((r) => r.id === retratoId) ??
    scene.pins.find((pin) => pin.retrato.id === retratoId)?.retrato;
  const entities = buildCombatEntities({ playerCharacters, npcs, enemies });
  const initiative = participants.map((p) => ({
    id: p.entity_id,
    name: entities.find((e) => e.id === p.entity_id)?.name ?? 'Inimigo',
    imageUrl: retratos.find((r) => r.id === p.entity_id)?.imageUrl,
    isMe: false,
    down: p.hp_current <= 0,
  }));

  const dock: DockItem<SpectatorPanel>[] = [
    { id: 'ficha', label: 'Ficha', icon: <BookOpen className="h-6 w-6" /> },
    { id: 'grupo', label: 'Grupo', icon: <Users className="h-6 w-6" /> },
  ];
  const title = openRetrato ? openRetrato.name : (dock.find((d) => d.id === panel)?.label ?? '');

  return (
    <div
      data-testid="moldura-da-sessao"
      className={`relative flex min-h-[70vh] flex-col md:flex-row ${panel !== null || !!openRetrato ? DOCK_PANEL_GAP : ''}`}
    >
      <main aria-label="Palco" className="flex min-w-0 flex-1 flex-col gap-4 pr-16 md:pr-0">
        <div className="mx-auto w-full max-w-md rounded-md border border-stone-700 bg-stone-800/50 p-3 text-center">
          <h2 className="flex items-center justify-center gap-2 text-xl font-bold text-stone-300">
            <span>👻</span> Modo Espectador
          </h2>
          <p className="mt-2 text-sm text-stone-400">
            Seu personagem não está mais entre os vivos nesta jornada. Você ainda pode acompanhar a
            sessão e as rolagens no chat ou na tela da sala.
          </p>
        </div>

        {hasActiveCombat && (
          <>
            <InitiativeStrip
              entries={initiative}
              currentId={currentTurnParticipant?.entity_id}
              round={activeCombat?.round_number ?? 1}
            />
            <CombatFeed attacks={attacks} abilityUses={abilityUses} />
          </>
        )}

        {shownMap ? (
          <MapaDoPalco
            map={shownMap}
            scene={scene}
            onOpenRetrato={(retrato) => {
              setPanel(null);
              setRetratoId(retrato.id);
            }}
          />
        ) : (
          <Retratos
            turnId={hasActiveCombat ? currentTurnParticipant?.entity_id : undefined}
            retratos={retratos}
            onOpen={(retrato) => {
              setPanel(null);
              setRetratoId(retrato.id);
            }}
          />
        )}
      </main>

      <DockRail
        items={dock}
        onOpen={(id) => {
          setRetratoId(null);
          setPanel(id);
        }}
      />

      <DockPanel
        open={panel !== null || !!openRetrato}
        onOpenChange={(open) => {
          if (open) return;
          setPanel(null);
          setRetratoId(null);
        }}
        title={title}
      >
        {openRetrato && <RetratoCard retrato={openRetrato} />}
        {panel === 'ficha' && (
          <div className="pointer-events-none opacity-70 grayscale">
            <CharacterSheetView userId={userId} sessionId={sessionId} />
          </div>
        )}
        {panel === 'grupo' && (
          <SessionParticipantList
            onlineUsers={onlineUsers}
            isGM={false}
            showTradeNotices={false}
            sessionId={sessionId}
            gmId={sessionData.gm_id}
            playerCharacters={playerCharacters.filter(
              (pc) => !pc.character.is_deleted && !pc.character.is_npc && !pc.character.is_enemy,
            )}
            npcs={npcs.filter((n) => n.is_visible)}
            activeTrades={activeTrades}
            activeTests={activeTests}
            testResults={testResults}
          />
        )}
      </DockPanel>
    </div>
  );
}
