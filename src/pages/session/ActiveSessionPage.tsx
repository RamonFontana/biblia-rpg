import { useParams, useNavigate } from 'react-router-dom';
import { SessionParticipantList } from '@/components/session/SessionParticipantList';
import { CharacterSheetView } from '@/components/character/CharacterSheetView';
import { useAuthStore } from '@/store/authStore';
import { useSupabasePresence, type PresenceState } from '@/hooks/useSupabasePresence';
import { useSessionNPCs } from '@/hooks/useSessionNPCs';
import { SessionNPCList } from '@/components/session/SessionNPCList';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useSessionTests } from '@/hooks/useSessionTests';
import { useSessionPlayerCharacters } from '@/hooks/useSessionPlayerCharacters';
import { useSessionTrades } from '@/hooks/useSessionTrades';
import { tradeService } from '@/services/tradeService';
import { TradeDialog } from '@/components/session/TradeDialog';
import { MasterTestDialog } from '@/components/session/MasterTestDialog';
import { PlayerTestDialog } from '@/components/session/PlayerTestDialog';
import { DiceRollerDialog } from '@/components/session/DiceRollerDialog';
import { NewDayDialog } from '@/components/session/NewDayDialog';
import { SessionRestControls } from '@/components/session/SessionRestControls';
import { PlayerRestIndicator } from '@/components/session/PlayerRestIndicator';
import type { TradeWithItems } from '@/types/trade';

export function ActiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [payload, setPayload] = useState<PresenceState | undefined>();
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { activeTests, testResults } = useSessionTests(id!);
  const {
    playerCharacters,
    updateLocalPlayerCharacter,
    refresh: refreshPlayerCharacters,
  } = useSessionPlayerCharacters(id!);
  const { npcs, updateLocalNPC, updateLocalNPCData } = useSessionNPCs(id);
  const { activeTrades, isCharacterTrading, refresh: refreshTrades } = useSessionTrades(id);

  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isDiceRollerOpen, setIsDiceRollerOpen] = useState(false);
  const [isNewDayDialogOpen, setIsNewDayDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setPayload({
        user_id: user.id,
        name: user.user_metadata?.name || user.user_metadata?.username || user.email?.split('@')[0] || 'Jogador',
        online_at: new Date().toISOString(),
      });
    }
  }, [user]);

  const { onlineUsers } = useSupabasePresence(id, payload);

  useEffect(() => {
    if (!id) return;

    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setSessionData(data);
      } else if (error) {
        console.error('Erro ao buscar sessão:', error);
      }
      setIsLoading(false);
    };

    fetchSession();

    const channel = supabase
      .channel(`session-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_sessions', filter: `id=eq.${id}` },
        (payload) => {
          setSessionData((current: any) => {
            const newSession = payload.new as any;
            if (current && current.current_period === 'Noite' && newSession.current_period === 'Manhã') {
              setIsNewDayDialogOpen(true);
            }
            return payload.new;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const isGM = user?.id === sessionData?.gm_id;

  const myActiveTrade = useMemo((): TradeWithItems | undefined => {
    if (!user) return undefined;
    return activeTrades.find((t) => {
      if (t.status !== 'active') return false;
      if (t.initiator_user_id === user.id) return true;
      if (t.type === 'shop' && isGM) return true;
      if (t.type === 'npc_trade' && isGM) return true;
      const myChar = playerCharacters.find((pc) => pc.user_id === user.id)?.character;
      if (myChar && t.target_character_id === myChar.id) return true;
      return false;
    });
  }, [activeTrades, user, isGM, playerCharacters]);

  const handleNegotiate = useCallback(
    async (targetUserId: string) => {
      if (!user || !id) return;
      const myChar = playerCharacters.find((pc) => pc.user_id === user.id)?.character;
      const targetChar = playerCharacters.find((pc) => pc.user_id === targetUserId)?.character;
      if (!myChar || !targetChar) return;
      if (isCharacterTrading(myChar.id) || isCharacterTrading(targetChar.id)) return;

      try {
        await tradeService.createTrade({
          sessionId: id,
          type: 'player_trade',
          initiatorUserId: user.id,
          initiatorCharacterId: myChar.id,
          targetCharacterId: targetChar.id,
          status: 'pending',
        });
        refreshTrades();
      } catch (e) {
        console.error('Erro ao criar negociação:', e);
      }
    },
    [user, id, playerCharacters, isCharacterTrading, refreshTrades]
  );

  const handleShop = useCallback(
    async (targetUserId: string) => {
      if (!user || !id || !isGM) return;
      const targetChar = playerCharacters.find((pc) => pc.user_id === targetUserId)?.character;
      if (!targetChar) return;
      if (isCharacterTrading(targetChar.id)) return;

      try {
        await tradeService.createTrade({
          sessionId: id,
          type: 'shop',
          initiatorUserId: user.id,
          initiatorCharacterId: null,
          targetCharacterId: targetChar.id,
          status: 'active',
        });
        refreshTrades();
      } catch (e) {
        console.error('Erro ao abrir lojinha:', e);
      }
    },
    [user, id, isGM, playerCharacters, isCharacterTrading, refreshTrades]
  );

  const handleNPCNegotiate = useCallback(
    async (npc: { id: string; name?: string; is_playable?: boolean }) => {
      if (!user || !id) return;
      const myChar = playerCharacters.find((pc) => pc.user_id === user.id)?.character;
      if (!myChar) return;
      if (isCharacterTrading(myChar.id)) return;

      try {
        if (npc.is_playable) {
          await tradeService.createTrade({
            sessionId: id,
            type: 'npc_trade',
            initiatorUserId: user.id,
            initiatorCharacterId: myChar.id,
            targetCharacterId: npc.id,
            status: 'pending',
          });
        } else {
          await tradeService.createTrade({
            sessionId: id,
            type: 'npc_trade',
            initiatorUserId: user.id,
            initiatorCharacterId: myChar.id,
            targetNpcId: npc.id,
            status: 'pending',
          });
        }
        refreshTrades();
      } catch (e) {
        console.error('Erro ao solicitar negociação com NPC:', e);
      }
    },
    [user, id, playerCharacters, isCharacterTrading, refreshTrades]
  );

  const handleAcceptTrade = useCallback(
    async (tradeId: string) => {
      try {
        await tradeService.acceptTrade(tradeId);
        refreshTrades();
      } catch (e) {
        console.error('Erro ao aceitar negociação:', e);
      }
    },
    [refreshTrades]
  );

  const handleRejectTrade = useCallback(
    async (tradeId: string) => {
      try {
        await tradeService.cancelTrade(tradeId);
        refreshTrades();
      } catch (e) {
        console.error('Erro ao recusar negociação:', e);
      }
    },
    [refreshTrades]
  );

  const refreshTradeState = useCallback(() => {
    refreshTrades();
    refreshPlayerCharacters();
  }, [refreshTrades, refreshPlayerCharacters]);

  const endSession = async () => {
    if (!id) return;
    try {
      await tradeService.cancelSessionTrades(id);
    } catch (e) {
      console.error('Erro ao cancelar negociações:', e);
    }

    try {
      // Delete playable NPCs associated with this session
      const npcIds = playerCharacters
        .filter(pc => pc.character?.is_npc)
        .map(pc => pc.character.id);

      if (npcIds.length > 0) {
        await supabase.from('characters').delete().in('id', npcIds);
      }
    } catch (e) {
      console.error('Erro ao deletar NPCs da sessão:', e);
    }

    const { error } = await supabase
      .from('game_sessions')
      .update({ status: 'finished' })
      .eq('id', id);

    if (!error) {
      navigate('/');
    }
  };

  useEffect(() => {
    return () => {
      if (!id || !user) return;
      const myTrades = activeTrades.filter(
        (t) =>
          (t.status === 'active' || t.status === 'pending') &&
          (t.initiator_user_id === user.id ||
            playerCharacters.find((pc) => pc.user_id === user.id)?.character?.id ===
              t.target_character_id)
      );
      for (const trade of myTrades) {
        tradeService.cancelTrade(trade.id).catch(console.error);
      }
    };
  }, []);

  const advanceTime = async () => {
    if (!id || !sessionData) return;

    let nextPeriod = 'Manhã';
    let nextDay = sessionData.current_day || 1;

    if (sessionData.current_period === 'Manhã') {
      nextPeriod = 'Tarde';
    } else if (sessionData.current_period === 'Tarde') {
      nextPeriod = 'Noite';
    } else if (sessionData.current_period === 'Noite') {
      nextPeriod = 'Manhã';
      nextDay += 1;
    }

    const { error } = await supabase
      .from('game_sessions')
      .update({
        current_period: nextPeriod,
        current_day: nextDay,
        ...(sessionData.current_period === 'Noite' ? { short_rests_today: 0 } : {}),
      })
      .eq('id', id);

    if (error) {
      console.error('Erro ao avançar o tempo:', error);
    }
  };

  const getPeriodIcon = (period: string) => {
    switch (period) {
      case 'Manhã': return '🌅';
      case 'Tarde': return '☀️';
      case 'Noite': return '🌙';
      default: return '🌅';
    }
  };

  if (isLoading) return <div className="p-8 text-center text-stone-300">Carregando sessão...</div>;
  if (!user) return <div className="p-8 text-center text-stone-300">Autenticação necessária.</div>;
  if (!sessionData || !id) return <div className="p-8 text-center text-stone-300">Sessão não encontrada.</div>;

  const currentActiveTest = activeTests.find((t) => t.status === 'active');
  const myResult =
    currentActiveTest && user
      ? (testResults[currentActiveTest.id] || []).find((r) => r.player_id === user.id)
      : null;
  const hasPendingTest = !!myResult;

  const tradeNpcName = myActiveTrade?.target_npc_id
    ? npcs.find((n) => n.id === myActiveTrade.target_npc_id)?.name
    : undefined;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-100">{sessionData.name}</h1>
          <p className="text-stone-400 mt-1">{sessionData.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-stone-800/50 rounded-full px-3 py-1 border border-stone-700">
            <span className="text-stone-300 font-medium text-sm mr-2 border-r border-stone-600 pr-2">
              DIA {sessionData.current_day || 1}
            </span>
            <span className="text-amber-400 text-sm font-semibold flex items-center gap-1">
              {getPeriodIcon(sessionData.current_period || 'Manhã')} {sessionData.current_period || 'Manhã'}
            </span>
          </div>

          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${sessionData.status === 'active' ? 'bg-green-100/20 text-green-400' : 'bg-gray-100/20 text-gray-400'}`}>
            {sessionData.status === 'active' ? 'Ativa' : 'Finalizada'}
          </div>
          {sessionData.status === 'active' && (
            <Button onClick={() => setIsDiceRollerOpen(true)} variant="outline" className="border-stone-500 text-stone-300 hover:bg-stone-800 hover:text-white flex items-center gap-2">
              <span>🎲</span> Dados
            </Button>
          )}
          {isGM && sessionData.status === 'active' && (
            <>
              <Button onClick={advanceTime} variant="outline" className="border-amber-600/50 text-amber-500 hover:bg-amber-600 hover:text-white flex items-center gap-2" title="Avançar Tempo">
                <span>⏳</span> Avançar
              </Button>
              <Button onClick={() => setIsTestDialogOpen(true)} variant="outline" className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white">
                Solicitar Teste
              </Button>
              <Button variant="destructive" onClick={endSession}>
                Finalizar Sessão
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-lg p-6 min-h-[60vh]">
        {isGM ? (
          <div className="space-y-6">
            <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-md mb-6">
              <h2 className="text-amber-500 font-bold flex items-center gap-2">
                <span className="text-xl">👑</span> Visão do Mestre
              </h2>
              <p className="text-amber-200/70 text-sm mt-1">Você é o mestre desta sessão. Aqui você gerencia os inimigos, NPCs e a narrativa.</p>
            </div>

            <SessionRestControls sessionId={id} sessionData={sessionData} playerCharacters={playerCharacters} npcs={npcs} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SessionParticipantList
                onlineUsers={onlineUsers}
                isGM={isGM}
                sessionId={id}
                gmId={sessionData.gm_id}
                playerCharacters={playerCharacters}
                activeTrades={activeTrades}
                onUpdatePlayerStat={updateLocalPlayerCharacter}
                onShop={handleShop}
                onAcceptTrade={handleAcceptTrade}
                onRejectTrade={handleRejectTrade}
              />
              <div className="border border-stone-800 rounded-lg p-4 bg-stone-950">
                <h3 className="text-xl font-semibold mb-4 text-stone-200">Inimigos</h3>
                <p className="text-stone-500 text-sm italic">Controle de combate em breve...</p>
              </div>

              <SessionNPCList
                npcs={npcs}
                sessionId={id}
                onUpdateNPCStat={updateLocalNPC}
                onUpdateNPCData={updateLocalNPCData}
                onNPCNegotiate={handleNPCNegotiate}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-md mb-6 max-w-md w-full text-center">
              <h2 className="text-blue-500 font-bold flex items-center justify-center gap-2">
                <span className="text-xl">⚔️</span> Visão do Jogador
              </h2>
              <p className="text-blue-200/70 text-sm mt-1">Você está conectado como jogador. Aguarde as instruções do Mestre.</p>
            </div>

            <PlayerRestIndicator sessionData={sessionData} character={playerCharacters.find((pc) => pc.user_id === user.id)?.character} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-6xl mt-4">
              <div className="border border-stone-800 rounded-lg p-4 bg-stone-950 lg:col-span-2">
                <CharacterSheetView userId={user.id} sessionId={id} />
              </div>

              <div className="border border-stone-800 rounded-lg p-4 bg-stone-950">
                <h3 className="text-xl font-semibold mb-4 text-stone-200 text-center">Personagens na Sessão</h3>
                <SessionParticipantList
                  onlineUsers={onlineUsers}
                  isGM={false}
                  sessionId={id}
                  gmId={sessionData.gm_id}
                  playerCharacters={playerCharacters}
                  npcs={npcs.filter((n) => (n as unknown as { is_visible?: boolean }).is_visible)}
                  activeTrades={activeTrades}
                  onNegotiate={handleNegotiate}
                  onNPCNegotiate={handleNPCNegotiate}
                  onAcceptTrade={handleAcceptTrade}
                  onRejectTrade={handleRejectTrade}
                />
              </div>
            </div>
          </div>
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
        sessionId={id!}
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
        playerCharacters={playerCharacters}
      />

      <DiceRollerDialog
        isOpen={isDiceRollerOpen}
        onClose={() => setIsDiceRollerOpen(false)}
      />

      <NewDayDialog
        isOpen={isNewDayDialogOpen}
        onClose={() => setIsNewDayDialogOpen(false)}
        day={sessionData.current_day || 1}
      />
    </div>
  );
}
