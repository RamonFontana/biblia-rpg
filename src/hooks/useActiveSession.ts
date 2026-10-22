import { useState, useEffect } from 'react';
import { listPlayerActiveSessions, type ActivePlayerSession } from '@/data-access/sessions';
import { useAuthStore } from '@/store/authStore';

export type { ActivePlayerSession };

export const useActiveSession = () => {
  const { user } = useAuthStore();
  const [activeSessions, setActiveSessions] = useState<ActivePlayerSession[]>([]);
  // Sem usuário não há o que carregar.
  const [loading, setLoading] = useState(Boolean(user));

  // Cada objeto de usuário novo recomeça o carregamento. Ajustar durante a renderização (e não num
  // efeito) evita um quadro com o usuário novo e `loading` desligado.
  const [loadedUser, setLoadedUser] = useState(user);
  if (loadedUser !== user) {
    setLoadedUser(user);
    setLoading(Boolean(user));
  }

  useEffect(() => {
    if (!user) return;

    const fetchActiveSessions = async () => {
      try {
        setActiveSessions(await listPlayerActiveSessions(user.id));
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
