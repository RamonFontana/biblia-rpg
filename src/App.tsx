import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from "@/components/layout"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { AuthCallbackPage } from "@/pages/auth/AuthCallbackPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"
import { CharacterCreationPage } from "@/pages/CharacterCreationPage"
import { CharacterList } from "@/features/character-management/pages/CharacterList"
import { CharacterEdit } from "@/features/character-management/pages/CharacterEdit"
import { CharacterDetails } from "@/features/character-management/pages/CharacterDetails"
import { CreateSessionPage } from "@/pages/session/CreateSessionPage"
import { ActiveSessionPage } from "@/pages/session/ActiveSessionPage"
import { Link } from 'react-router-dom'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

function Home() {
  const { signOut, user } = useAuthStore()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      supabase
        .from('game_sessions')
        .select('id')
        .eq('gm_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) setActiveSessionId(data.id)
        })
    }
  }, [user])

  return (
    <Layout>
      <div className="flex justify-end mb-4">
        <button 
          onClick={signOut}
          className="px-4 py-2 bg-stone-200 text-stone-800 font-semibold rounded hover:bg-stone-300 transition-colors"
        >
          Deslogar
        </button>
      </div>
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight">
          Biblical RPG Development Environment
        </h2>
        <p className="text-muted-foreground max-w-md">
          A base do projeto está configurada com Vite, React, TypeScript, Tailwind, Shadcn UI, Zustand e React Query.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Link to="/characters" className="px-6 py-3 bg-stone-800 text-stone-300 font-bold rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-colors">
            Meus Personagens
          </Link>
          <Link to="/create-character" className="px-6 py-3 bg-amber-600 text-stone-900 font-bold rounded-lg hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/20">
            Criar Personagem
          </Link>
          {!activeSessionId && (
            <Link to="/session/create" className="px-6 py-3 bg-red-700 text-stone-100 font-bold rounded-lg hover:bg-red-600 transition-colors shadow-lg shadow-red-900/20">
              Mestre: Criar Sessão
            </Link>
          )}
          {activeSessionId && (
            <Link to={`/session/${activeSessionId}`} className="px-6 py-3 bg-green-700 text-stone-100 font-bold rounded-lg hover:bg-green-600 transition-colors shadow-lg shadow-green-900/20">
              Acessar Sessão Ativa
            </Link>
          )}
        </div>
      </div>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        
        {/* Rotas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/create-character" element={<CharacterCreationPage />} />
          <Route path="/characters" element={
            <Layout>
              <CharacterList />
            </Layout>
          } />
          <Route path="/characters/:id" element={
            <Layout>
              <CharacterDetails />
            </Layout>
          } />
          <Route path="/characters/:id/edit" element={
            <Layout>
              <CharacterEdit />
            </Layout>
          } />
          <Route path="/session/create" element={
            <Layout>
              <CreateSessionPage />
            </Layout>
          } />
          <Route path="/session/:id" element={
            <Layout>
              <ActiveSessionPage />
            </Layout>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
