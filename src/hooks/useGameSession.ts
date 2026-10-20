import { useEffect, useRef, useState } from 'react';
import { getGameSession, subscribeToGameSession, type GameSession } from '@/data-access/sessions';
import { isNewDay } from '@/domain/sessionTime';

/**
 * A sessão da mesa: lê uma vez e acompanha as mudanças em tempo real. Quando a Noite vira Manhã
 * (o Mestre avançou o tempo), liga `isNewDayDialogOpen` para a tela avisar o novo dia.
 */
export function useGameSession(id: string | undefined) {
  const [sessionData, setSessionData] = useState<GameSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewDayDialogOpen, setIsNewDayDialogOpen] = useState(false);
  const latest = useRef<GameSession | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchSession = async () => {
      try {
        const session = await getGameSession(id);
        latest.current = session;
        setSessionData(session);
      } catch (error) {
        console.error('Erro ao buscar sessão:', error);
      }
      setIsLoading(false);
    };

    fetchSession();

    return subscribeToGameSession(id, (newSession) => {
      if (latest.current && isNewDay(latest.current.current_period, newSession.current_period)) {
        setIsNewDayDialogOpen(true);
      }
      latest.current = newSession;
      setSessionData(newSession);
    });
  }, [id]);

  return { sessionData, isLoading, isNewDayDialogOpen, setIsNewDayDialogOpen };
}
