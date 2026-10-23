import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCombatStore } from '@/store/combatStore';
import { updateGameSession } from '@/data-access/sessions';
import { cancelTrade } from '@/data-access/trades';
import { endSession as endSessionService } from '@/services/sessionService';
import { useGameSession } from '@/hooks/useGameSession';
import { useSessionPresence } from '@/hooks/useSessionPresence';
import { useSessionTests } from '@/hooks/useSessionTests';
import { useSessionCharacters } from '@/hooks/useSessionCharacters';
import { useSessionTrades } from '@/hooks/useSessionTrades';
import { useSessionTradeActions } from '@/hooks/useSessionTradeActions';
import { useCombatToast } from '@/hooks/useCombatToast';
import { advanceSessionClock } from '@/domain/sessionTime';
import { findMyActiveTrade, findTradesToCancelOnLeave } from '@/domain/trades';
import { buildCombatEntities } from '@/lib/combatEntities';
import { TradeDialog } from '@/components/session/TradeDialog';
import { MasterTestDialog } from '@/components/session/MasterTestDialog';
import { PlayerTestDialog } from '@/components/session/PlayerTestDialog';
import { DiceRollerDialog } from '@/components/session/DiceRollerDialog';
import { NewDayDialog } from '@/components/session/NewDayDialog';
import { EndSessionDialog } from '@/components/session/EndSessionDialog';
import { CombatSetupModal } from '@/components/combat/CombatSetupModal';
import { SessionHeader } from '@/components/session/active-session/SessionHeader';
import { GmSessionView } from '@/components/session/active-session/GmSessionView';
import { SpectatorView } from '@/components/session/active-session/SpectatorView';
import { PlayerSessionView } from '@/components/session/active-session/PlayerSessionView';
import { CombatToast } from '@/components/session/active-session/CombatToast';

export function ActiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { sessionData, isLoading, isNewDayDialogOpen, setIsNewDayDialogOpen } = useGameSession(id);
  const { onlineUsers } = useSessionPresence(id, user);

  const { activeTests, testResults } = useSessionTests(id!);
  const {
    playerCharacters,
    npcs,
    enemies,
    refresh: refreshPlayerCharacters,
    updateLocal,
    isLoading: isCharactersLoading,
  } = useSessionCharacters(id);

  const { activeTrades, isCharacterTrading, refresh: refreshTrades } = useSessionTrades(id);

  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState(false);
  const [isEndSessionDialogOpen, setIsEndSessionDialogOpen] = useState(false);
  const [isCombatSetupOpen, setIsCombatSetupOpen] = useState(false);
  const toastMessage = useCombatToast();

  const { activeCombat, initSubscriptions, cleanupSubscriptions } = useCombatStore();

  useEffect(() => {
    if (id) {
      initSubscriptions(id);
      return () => cleanupSubscriptions();
    }
  }, [id, initSubscriptions, cleanupSubscriptions]);

  const isGM = user?.id === sessionData?.gm_id;
  const myCharacter = playerCharacters.find((pc) => pc.user_id === user?.id)?.character;

  const myActiveTrade = useMemo(
    () =>
      user
        ? findMyActiveTrade(activeTrades, { userId: user.id, isGM, characterId: myCharacter?.id })
        : undefined,
    [activeTrades, user, isGM, myCharacter?.id],
  );

  const { handleNegotiate, handleShop, handleNPCNegotiate, handleAcceptTrade, handleRejectTrade } =
    useSessionTradeActions({
      sessionId: id,
      user,
      isGM,
      playerCharacters,
      isCharacterTrading,
      refreshTrades,
    });

  const refreshTradeState = () => {
    refreshTrades();
    refreshPlayerCharacters();
  };

  const endSession = async (levelUpCharacterIds: string[]) => {
    if (!id) return;
    const success = await endSessionService(id, levelUpCharacterIds);
    if (success) {
      navigate('/');
    }
  };

  // Sair da mesa cancela as trocas abertas da pessoa (a outra ponta fica sem a janela). A limpeza
  // roda ao desmontar, então lê as trocas por um ref que acompanha o estado mais novo.
  const leaving = useRef({ activeTrades, userId: user?.id, characterId: myCharacter?.id });
  useEffect(() => {
    leaving.current = { activeTrades, userId: user?.id, characterId: myCharacter?.id };
  });
  useEffect(() => {
    return () => {
      const { activeTrades: trades, userId, characterId } = leaving.current;
      if (!userId) return;
      for (const trade of findTradesToCancelOnLeave(trades, { userId, characterId })) {
        cancelTrade(trade.id).catch(console.error);
      }
    };
  }, []);

  const advanceTime = async () => {
    if (!id || !sessionData) return;

    try {
      await updateGameSession(id, advanceSessionClock(sessionData));
    } catch (error) {
      console.error('Erro ao avançar o tempo:', error);
    }
  };

  const availableEntities = useMemo(
    () => buildCombatEntities({ playerCharacters, npcs, enemies }),
    [playerCharacters, npcs, enemies],
  );

  if (isLoading) return <div className="p-8 text-center text-stone-300">Carregando sessão...</div>;
  if (!user) return <div className="p-8 text-center text-stone-300">Autenticação necessária.</div>;
  if (!sessionData || !id)
    return <div className="p-8 text-center text-stone-300">Sessão não encontrada.</div>;

  const currentActiveTest = activeTests.find((t) => t.status === 'active');
  const myResult =
    currentActiveTest && user
      ? (testResults[currentActiveTest.id] || []).find((r) => r.player_id === user.id)
      : null;
  const hasPendingTest = !!myResult;

  const tradeNpcName = myActiveTrade?.target_npc_id
    ? npcs.find((n) => n.id === myActiveTrade.target_npc_id)?.name
    : undefined;

  const isSpectator = myCharacter && myCharacter.is_deleted;

  return (
    <div className="container mx-auto py-2 md:py-8 px-1 sm:px-2 md:px-4 overflow-x-hidden">
      <SessionHeader
        sessionData={sessionData}
        isGM={isGM}
        isSpectator={!!isSpectator}
        onOpenDice={() => setIsDiceRollerOpen(true)}
        onAdvanceTime={advanceTime}
        onOpenTest={() => setIsTestDialogOpen(true)}
        onOpenCombat={() => setIsCombatSetupOpen(true)}
        onOpenEndSession={() => setIsEndSessionDialogOpen(true)}
      />

      <div className="bg-stone-900 border border-stone-800 rounded-lg p-2 sm:p-3 md:p-6 min-h-[60vh]">
        {isGM ? (
          <GmSessionView
            sessionId={id}
            sessionData={sessionData}
            playerCharacters={playerCharacters}
            npcs={npcs}
            enemies={enemies}
            isCharactersLoading={isCharactersLoading}
            hasActiveCombat={!!activeCombat}
            availableEntities={availableEntities}
            onlineUsers={onlineUsers}
            activeTrades={activeTrades}
            activeTests={activeTests}
            testResults={testResults}
            updateLocal={updateLocal}
            onShop={handleShop}
            onAcceptTrade={handleAcceptTrade}
            onRejectTrade={handleRejectTrade}
            onNPCNegotiate={handleNPCNegotiate}
          />
        ) : isSpectator ? (
          <SpectatorView userId={user.id} sessionId={id} />
        ) : (
          <PlayerSessionView
            userId={user.id}
            sessionId={id}
            sessionData={sessionData}
            myCharacter={myCharacter}
            playerCharacters={playerCharacters}
            npcs={npcs}
            enemies={enemies}
            isCharactersLoading={isCharactersLoading}
            hasActiveCombat={!!activeCombat}
            onlineUsers={onlineUsers}
            activeTrades={activeTrades}
            activeTests={activeTests}
            testResults={testResults}
            updateLocal={updateLocal}
            onNegotiate={handleNegotiate}
            onNPCNegotiate={handleNPCNegotiate}
            onAcceptTrade={handleAcceptTrade}
            onRejectTrade={handleRejectTrade}
          />
        )}
      </div>

      {myActiveTrade && (
        <TradeDialog
          trade={myActiveTrade}
          isOpen={true}
          currentUserId={user.id}
          isGM={isGM}
          playerCharacters={playerCharacters}
          npcName={tradeNpcName}
          onClose={refreshTradeState}
          onTradeUpdated={refreshTradeState}
        />
      )}

      <MasterTestDialog
        sessionId={id}
        isOpen={isTestDialogOpen}
        onClose={() => setIsTestDialogOpen(false)}
        activeTests={activeTests}
        testResults={testResults}
        playerCharacters={playerCharacters}
      />

      <PlayerTestDialog
        isOpen={hasPendingTest && !isGM}
        activeTest={currentActiveTest || null}
        testResult={myResult || null}
      />

      <DiceRollerDialog isOpen={isDiceRollerOpen} onClose={() => setIsDiceRollerOpen(false)} />

      <NewDayDialog
        isOpen={isNewDayDialogOpen}
        onClose={() => setIsNewDayDialogOpen(false)}
        day={sessionData.current_day || 1}
      />

      <EndSessionDialog
        isOpen={isEndSessionDialogOpen}
        onClose={() => setIsEndSessionDialogOpen(false)}
        onConfirm={endSession}
        playerCharacters={playerCharacters}
      />

      {isCombatSetupOpen && (
        <CombatSetupModal
          isOpen={isCombatSetupOpen}
          onClose={() => setIsCombatSetupOpen(false)}
          sessionId={id}
          availableEntities={availableEntities}
        />
      )}

      <CombatToast message={toastMessage} />
    </div>
  );
}
