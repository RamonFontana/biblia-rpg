import type { CharacterTestContext } from '@/data-access/characters';
import type { SessionTest, SessionTestResult } from '@/data-access/sessionTests';
import { failureCostsFaith } from '@/domain/sessionTests';
import { getTestBreakdown } from '@/features/character-management/utils/characterMath';

interface SubmittedResultProps {
  test: SessionTest;
  result: SessionTestResult;
  sheet: CharacterTestContext | null;
  onDismiss: () => void;
}

/** O aviso depois do envio: resultado, aprovação e a conta do dado, à espera do Mestre. */
export function SubmittedResult({ test, result, sheet, onDismiss }: SubmittedResultProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-lg p-4 sm:p-6 max-w-sm w-full max-h-[95vh] overflow-y-auto text-stone-200 shadow-2xl text-center relative">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-100 transition-colors"
          title="Fechar aviso"
        >
          ✕
        </button>

        <div className="mb-4 mt-2">
          <svg
            className="w-12 h-12 mx-auto text-amber-500 mb-2 animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-xl font-serif text-amber-500">Resultado Enviado!</h2>
        </div>

        <div className="p-4 bg-stone-800 rounded mb-4">
          <p className="text-stone-400 text-sm mb-1">Seu Resultado</p>
          <div className="flex flex-col justify-center items-center gap-2">
            <div className="flex justify-center items-center gap-4">
              <span className="text-3xl font-mono bg-stone-950 px-4 py-2 rounded-lg border border-stone-700">
                {result.result_value}
              </span>
              {result.is_approved ? (
                <span className="text-green-500 font-bold px-4 py-2 bg-green-500/10 rounded-lg text-xl border border-green-500/20">
                  Aprovado!
                </span>
              ) : (
                <span className="text-red-500 font-bold px-4 py-2 bg-red-500/10 rounded-lg text-xl border border-red-500/20">
                  Reprovado
                </span>
              )}
            </div>
            <p className="text-stone-400 font-mono text-sm mt-2">
              {getTestBreakdown(test.test_type, result.result_value, sheet, result.roll_value)}
            </p>
          </div>

          {!result.is_approved &&
            test.test_type === 'Fé' &&
            (failureCostsFaith(test.faith_use, test.selfish_request) ? (
              <div className="mt-4 text-red-400 italic bg-red-500/10 p-2 rounded border border-red-500/20">
                Sua fé foi abalada... O personagem perdeu 1d6 pontos de Fé.
              </div>
            ) : (
              <div className="mt-4 text-stone-300 italic bg-stone-700/40 p-2 rounded border border-stone-600">
                A Vontade Divina disse &quot;agora não&quot;: silêncio divino, sem perda de Fé.
              </div>
            ))}

          <p className="mt-6 text-sm text-stone-500">O Mestre já pode ver o seu resultado.</p>
        </div>

        <p className="text-sm text-stone-500 italic mb-4">
          Aguardando o mestre encerrar o teste...
        </p>

        <button
          onClick={onDismiss}
          className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-600 transition-colors"
        >
          Ocultar Janela
        </button>
      </div>
    </div>
  );
}
