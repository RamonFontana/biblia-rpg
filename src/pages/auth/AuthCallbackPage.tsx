import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { setSession } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session)
        navigate('/', { replace: true })
      } else {
        // Se a sessão não estiver pronta, o listener global (que será implementado no polish phase) resolve,
        // mas aqui forçamos uma tentativa ou enviamos para login em caso de falha.
        supabase.auth.onAuthStateChange((_event, newSession) => {
          if (newSession) {
            setSession(newSession)
            navigate('/', { replace: true })
          } else {
            navigate('/login', { replace: true })
          }
        })
      }
    })
  }, [navigate, setSession])

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Autenticando...</p>
    </div>
  )
}
