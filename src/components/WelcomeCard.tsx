import { Button } from "@/components/ui/button"

export function WelcomeCard() {
  return (
    <div className="bg-card text-card-foreground border rounded-lg shadow-sm p-6 w-full max-w-md mx-auto mt-8 flex flex-col items-center gap-4 text-center">
      <h3 className="text-xl font-semibold">Testando UI Components</h3>
      <p className="text-sm text-muted-foreground">
        Se este botão renderizar com os estilos corretos do Shadcn UI e Tailwind, o setup está 100% funcional.
      </p>
      <Button onClick={() => alert('O componente Button está funcionando perfeitamente!')}>
        Clique para testar
      </Button>
    </div>
  )
}
