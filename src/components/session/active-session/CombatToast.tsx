/** O aviso de combate no canto da tela. */
export function CombatToast({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-stone-800 border-2 border-amber-500 text-stone-100 p-4 rounded shadow-lg animate-in slide-in-from-bottom-5 max-w-[calc(100vw-2rem)] sm:max-w-sm">
      <div className="flex items-center gap-2">
        <span className="text-amber-500 text-xl">🛡️</span>
        <span className="font-semibold text-sm">{message}</span>
      </div>
    </div>
  );
}
