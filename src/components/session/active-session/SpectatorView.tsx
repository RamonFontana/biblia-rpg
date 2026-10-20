import { CharacterSheetView } from '@/components/character/CharacterSheetView';

/** Quem teve a ficha excluída só acompanha a sessão, com a ficha apagada e sem controles. */
export function SpectatorView({ userId, sessionId }: { userId: string; sessionId: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="p-3 md:p-4 bg-stone-800/50 border border-stone-700 rounded-md mb-4 md:mb-6 max-w-md w-full text-center">
        <h2 className="text-stone-300 font-bold flex items-center justify-center gap-2 text-xl">
          <span>👻</span> Modo Espectador
        </h2>
        <p className="text-stone-400 text-sm mt-2">
          Seu personagem não está mais entre os vivos nesta jornada. Você ainda pode acompanhar a
          sessão e as rolagens no chat ou na tela da sala.
        </p>
      </div>

      <div className="w-full max-w-4xl opacity-70 pointer-events-none grayscale">
        <CharacterSheetView userId={userId} sessionId={sessionId} />
      </div>
    </div>
  );
}
