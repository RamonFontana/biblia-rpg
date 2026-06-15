import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './../lib/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  setSession: (session: Session | null) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  setSession: (session) => set({ session, user: session?.user || null }),
  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null })
  },
}))

// Inicializa o listener de auth do Supabase
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSession(session)
})

supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.getState().setSession(session)
})
