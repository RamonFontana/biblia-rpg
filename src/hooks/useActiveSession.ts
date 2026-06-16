import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export interface ActivePlayerSession {
  session_id: string;
  character_id: string;
  session_name: string;
  gm_id: string;
}

export const useActiveSession = () => {
  const { user } = useAuthStore();
  const [activeSessions, setActiveSessions] = useState<ActivePlayerSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchActiveSessions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('session_participants')
          .select(`
            session_id,
            character_id,
            game_sessions!inner (
              id,
              name,
              status,
              gm_id
            )
          `)
          .eq('user_id', user.id)
          .eq('game_sessions.status', 'active');

        if (error) throw error;

        if (data) {
          const sessions = data.map((d: any) => ({
            session_id: d.session_id,
            character_id: d.character_id,
            session_name: d.game_sessions?.name || 'Sessão Ativa',
            gm_id: d.game_sessions?.gm_id || '',
          }));
          setActiveSessions(sessions);
        }
      } catch (err) {
        console.error('Error fetching active sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveSessions();

    // Optionally set up a realtime subscription if needed
    // But for now, fetching on mount is enough for the dashboard
  }, [user]);

  return { activeSessions, loading };
};
