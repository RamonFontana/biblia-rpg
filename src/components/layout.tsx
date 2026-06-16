import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Home } from "lucide-react"

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">RPG Bíblico</h1>
        <Link to="/" className="flex items-center gap-2 text-sm font-medium hover:text-amber-600 transition-colors">
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
      </header>
      <main className="flex-1 container mx-auto p-6">
        {children}
      </main>
      <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
        RPG Bíblico &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}
