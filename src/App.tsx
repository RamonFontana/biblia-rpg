import { Layout } from "@/components/layout"
import { WelcomeCard } from "@/components/WelcomeCard"

function App() {
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

export default App
