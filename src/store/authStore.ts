import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { getSession, onAuthStateChange, signOut as signOutUser } from '@/data-access/auth';

interface AuthState {
  session: Session | null;
  user: User | null;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  setSession: (session) => set({ session, user: session?.user || null }),
  signOut: async () => {
    await signOutUser();
    set({ session: null, user: null });
  },
}));

// Inicializa o listener de auth do Supabase
onAuthStateChange((session) => {
  useAuthStore.getState().setSession(session);
});

getSession().then((session) => {
  useAuthStore.getState().setSession(session);
});
