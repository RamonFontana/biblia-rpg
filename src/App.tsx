import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from "@/components/layout"
import { WelcomeCard } from "@/components/WelcomeCard"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { LoginPage } from "@/pages/auth/LoginPage"
import { RegisterPage } from "@/pages/auth/RegisterPage"
import { AuthCallbackPage } from "@/pages/auth/AuthCallbackPage"
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage"
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage"

function Home() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight">
          Biblical RPG Development Environment
        </h2>
        <p className="text-muted-foreground max-w-md">
          A base do projeto está configurada com Vite, React, TypeScript, Tailwind, Shadcn UI, Zustand e React Query.
        </p>
        <WelcomeCard />
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
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
