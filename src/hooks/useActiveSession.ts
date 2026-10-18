import { useState, useEffect } from 'react';
import { listPlayerActiveSessions, type ActivePlayerSession } from '@/data-access/sessions';
import { useAuthStore } from '@/store/authStore';

export type { ActivePlayerSession };

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
