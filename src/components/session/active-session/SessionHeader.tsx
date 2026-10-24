import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { GameSession } from '@/data-access/sessions';
import { getPeriodIcon } from '@/domain/sessionTime';

interface SessionHeaderProps {
  sessionData: GameSession;
  isGM: boolean;
  isSpectator: boolean;
  onOpenDice: () => void;
  onAdvanceTime: () => void;
  onOpenTest: () => void;
  onOpenCombat: () => void;
  onOpenEndSession: () => void;
}

/** Nome da sessão, dia e período, estado e os botões do Mestre (menu no celular). */
export function SessionHeader({
  sessionData,
  isGM,
  isSpectator,
  onOpenDice,
  onAdvanceTime,
  onOpenTest,
  onOpenCombat,
  onOpenEndSession,
}: SessionHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 md:mb-6 border-b border-stone-800 pb-4">
      <div className="w-full lg:w-auto">
        <h1 className="text-2xl md:text-3xl font-extrabold text-stone-100">
          {sessionData.name}{' '}
          {isSpectator && (
            <span className="text-sm font-normal ml-2 text-stone-400 bg-stone-800 px-2 py-1 rounded-full border border-stone-700">
              Modo Espectador
            </span>
          )}
        </h1>
        <p className="text-stone-400 mt-1">{sessionData.description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full lg:w-auto">
        <div className="flex items-center bg-stone-800/50 rounded-full px-3 py-1 border border-stone-700">
          <span className="text-stone-300 font-medium text-xs md:text-sm mr-2 border-r border-stone-600 pr-2">
            DIA {sessionData.current_day || 1}
          </span>
          <span className="text-amber-400 text-xs md:text-sm font-semibold flex items-center gap-1">
            {getPeriodIcon(sessionData.current_period || 'Manhã')}{' '}
            {sessionData.current_period || 'Manhã'}
          </span>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${sessionData.status === 'active' ? 'bg-green-100/20 text-green-400' : 'bg-stone-700 text-stone-300'}`}
        >
          {sessionData.status === 'active' ? 'Ativa' : 'Finalizada'}
        </div>
        {sessionData.status === 'active' && !isSpectator && (
          <Button
            onClick={onOpenDice}
            variant="outline"
            className="border-stone-500 text-stone-300 hover:bg-stone-800 hover:text-stone-100 flex items-center gap-2 h-8 md:h-10 px-2 md:px-4"
          >
            <span>🎲</span> <span className="hidden md:inline">Dados</span>
          </Button>
        )}
        {isGM && sessionData.status === 'active' && (
          <>
            <div className="hidden lg:flex items-center gap-2">
              <Button
                onClick={onAdvanceTime}
                variant="outline"
                className="border-amber-600/50 text-amber-500 hover:bg-amber-600 hover:text-stone-100 flex items-center gap-2"
                title="Avançar Tempo"
              >
                <span>⏳</span> Avançar
              </Button>
              <Button
                onClick={onOpenTest}
                variant="outline"
                className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-stone-100"
              >
                Solicitar Teste
              </Button>
              <Button
                onClick={onOpenCombat}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-stone-100 flex items-center gap-2"
              >
                <span>⚔️</span> Iniciar Combate
              </Button>
              <Button variant="destructive" onClick={onOpenEndSession}>
                Finalizar Sessão
              </Button>
            </div>
            <div className="lg:hidden ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-stone-600 bg-stone-800 h-8 px-2 md:h-10 md:px-4"
                  >
                    <Menu className="h-4 w-4 md:h-5 md:w-5 text-stone-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-stone-900 border-stone-800 text-stone-300"
                >
                  <DropdownMenuItem
                    onClick={onAdvanceTime}
                    className="hover:bg-stone-800 cursor-pointer"
                  >
                    <span className="mr-2">⏳</span> Avançar Tempo
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onOpenTest}
                    className="hover:bg-stone-800 cursor-pointer"
                  >
                    <span className="mr-2">🎲</span> Solicitar Teste
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onOpenCombat}
                    className="hover:bg-stone-800 cursor-pointer text-red-400"
                  >
                    <span className="mr-2">⚔️</span> Iniciar Combate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onOpenEndSession}
                    className="hover:bg-red-900/50 cursor-pointer text-red-500 mt-2 font-medium"
                  >
                    Finalizar Sessão
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
