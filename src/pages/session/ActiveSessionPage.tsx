import { useParams } from 'react-router-dom';
import { OnlinePlayersList } from '@/components/session/OnlinePlayersList';
import { useAuthStore } from '@/store/authStore';
import { useSupabasePresence, type PresenceState } from '@/hooks/useSupabasePresence';
import { useEffect, useState } from 'react';

export function ActiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [payload, setPayload] = useState<PresenceState | undefined>();

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

  if (!id) return <div className="p-8 text-center text-stone-300">Sessão não encontrada</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-100">Sessão Ativa</h1>
          <p className="text-stone-400 mt-1">ID: {id}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-stone-900 border border-stone-800 rounded-lg p-6 min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <p className="text-stone-500 mb-2">A área principal do jogo e os recursos da sessão estarão aqui.</p>
            <p className="text-stone-600 text-sm">O Realtime do Supabase já está conectado e rastreando presença.</p>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <OnlinePlayersList onlineUsers={onlineUsers} />
        </div>
      </div>
    </div>
  );
}
