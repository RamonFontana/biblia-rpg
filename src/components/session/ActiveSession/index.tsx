import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export function ActiveSession() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

    // Subscribe to realtime changes
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

  if (isLoading) return <div className="p-8 text-center">Carregando sessão...</div>;
  if (!sessionData) return <div className="p-8 text-center">Sessão não encontrada.</div>;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold">{sessionData.name}</h1>
          <p className="text-muted-foreground">{sessionData.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${sessionData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {sessionData.status === 'active' ? 'Ativa' : 'Finalizada'}
          </div>
          {sessionData.status === 'active' && (
            <Button variant="destructive" onClick={endSession}>
              Finalizar Sessão
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="text-xl font-semibold mb-4 text-primary">Jogadores</h2>
          <p className="text-muted-foreground text-sm italic">Sincronização realtime em breve...</p>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <h2 className="text-xl font-semibold mb-4 text-primary">Inimigos</h2>
          <p className="text-muted-foreground text-sm italic">Sincronização realtime em breve...</p>
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <h2 className="text-xl font-semibold mb-4 text-primary">NPCs</h2>
          <p className="text-muted-foreground text-sm italic">Sincronização realtime em breve...</p>
        </div>
      </div>
    </div>
  );
}
