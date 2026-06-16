import { useParams, useNavigate } from 'react-router-dom';
import { OnlinePlayersList } from '@/components/session/OnlinePlayersList';
import { CharacterSheetView } from '@/components/character/CharacterSheetView';
import { useAuthStore } from '@/store/authStore';
import { useSupabasePresence, type PresenceState } from '@/hooks/useSupabasePresence';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export function ActiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [payload, setPayload] = useState<PresenceState | undefined>();
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Presence effect
  useEffect(() => {
    if (user) {
      setPayload({
        user_id: user.id,
        name: user.user_metadata?.name || user.user_metadata?.username || user.email?.split('@')[0] || 'Jogador',
        online_at: new Date().toISOString()
      });
    }
  }, [user]);

  const { onlineUsers } = useSupabasePresence(id, payload);

  // Fetch session data and realtime updates
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
        console.error("Erro ao buscar sessão:", error);
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
          setSessionData(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const endSession = async () => {
    if (!id) return;
    const { error } = await supabase
      .from('game_sessions')
      .update({ status: 'finished' })
      .eq('id', id);

    if (!error) {
      navigate('/');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-stone-300">Carregando sessão...</div>;
  if (!user) return <div className="p-8 text-center text-stone-300">Autenticação necessária.</div>;
  if (!sessionData || !id) return <div className="p-8 text-center text-stone-300">Sessão não encontrada.</div>;

  const isGM = user?.id === sessionData.gm_id;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-100">{sessionData.name}</h1>
          <p className="text-stone-400 mt-1">{sessionData.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${sessionData.status === 'active' ? 'bg-green-100/20 text-green-400' : 'bg-gray-100/20 text-gray-400'}`}>
            {sessionData.status === 'active' ? 'Ativa' : 'Finalizada'}
          </div>
          {isGM && sessionData.status === 'active' && (
            <Button variant="destructive" onClick={endSession}>
              Finalizar Sessão
            </Button>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <OnlinePlayersList onlineUsers={onlineUsers} isGM={true} sessionId={id} gmId={sessionData.gm_id} />

              <div className="border border-stone-800 rounded-lg p-4 bg-stone-950">
                <h3 className="text-xl font-semibold mb-4 text-stone-200">Inimigos</h3>
                <p className="text-stone-500 text-sm italic">Controle de combate em breve...</p>
              </div>

              <div className="border border-stone-800 rounded-lg p-4 bg-stone-950">
                <h3 className="text-xl font-semibold mb-4 text-stone-200">NPCs</h3>
                <p className="text-stone-500 text-sm italic">Gestão de NPCs em breve...</p>
              </div>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-6xl mt-4">
              <div className="border border-stone-800 rounded-lg p-4 bg-stone-950 lg:col-span-2">
                <CharacterSheetView userId={user.id} sessionId={id} />
              </div>

              <div className="border border-stone-800 rounded-lg p-4 bg-stone-950">
                <h3 className="text-xl font-semibold mb-4 text-stone-200 text-center">Jogadores na Sessão</h3>
                <OnlinePlayersList onlineUsers={onlineUsers} isGM={false} sessionId={id} gmId={sessionData.gm_id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
