import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, onAuthStateChange } from '@/data-access/auth';
import { useAuthStore } from '@/store/authStore';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { setSession } = useAuthStore();

  useEffect(() => {
    let stopListening: (() => void) | undefined;
    let unmounted = false;

    getSession().then((session) => {
      if (unmounted) return;
      if (session) {
        setSession(session);
        navigate('/', { replace: true });
      } else {
        // Se a sessão não estiver pronta, o listener global (que será implementado no polish phase) resolve,
        // mas aqui forçamos uma tentativa ou enviamos para login em caso de falha.
        stopListening = onAuthStateChange((newSession) => {
          if (newSession) {
            setSession(newSession);
            navigate('/', { replace: true });
          } else {
            navigate('/login', { replace: true });
          }
        });
      }
    });

    return () => {
      unmounted = true;
      stopListening?.();
    };
  }, [navigate, setSession]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Autenticando...</p>
    </div>
  );
}
