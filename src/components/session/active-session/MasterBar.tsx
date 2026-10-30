// A Barra do Mestre, embaixo da tela (ADR 0009): os comandos da mesa. No combate, Iniciar Combate
// dá lugar a Finalizar Combate e Próximo Turno. Termos: CONTEXT.md (Barra do Mestre, Combate).
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCombatStore } from '@/store/combatStore';

interface MasterBarProps {
  onOpenTest: () => void;
  onOpenCombat: () => void;
  onAdvanceTime: () => void;
  onOpenRest: () => void;
  onOpenDice: () => void;
  /** Os NPCs jogáveis que o Mestre conduz; sem eles, não há seletor. */
  npcs?: { id: string; name: string }[];
  /** Quem a Hotbar da Barra mostra. */
  actingAs?: string;
  /** É o turno do NPC: a Hotbar dele aparece sozinha e o seletor não troca. */
  actAsLocked?: boolean;
  onActAs?: (npcId: string | undefined) => void;
  /** No celular os comandos ficam atrás do botão Comandos, para a Hotbar do NPC ter espaço. */
  collapsible?: boolean;
}

export function MasterBar({
  onOpenTest,
  onOpenCombat,
  onAdvanceTime,
  onOpenRest,
  onOpenDice,
  npcs = [],
  actingAs,
  actAsLocked = false,
  onActAs,
  collapsible = false,
}: MasterBarProps) {
  const { activeCombat, nextTurn, endCombat } = useCombatStore();

  // O avanço e o fim leem o banco e gravam: enquanto um não termina, os dois botões esperam. Um
  // segundo clique partiria do mesmo turno (ou finalizaria o combate duas vezes).
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const showCommands = !collapsible || open;
  const runOnce = async (action: () => Promise<void>, failure: string) => {
    if (saving) return;
    setSaving(true);
    try {
      await action();
    } catch (error) {
      console.error(failure, error);
    } finally {
      setSaving(false);
    }
  };

  const plain = 'min-h-11 border-stone-500 text-stone-300 hover:bg-stone-800 hover:text-stone-100';
  return (
    <section
      aria-label="Barra do Mestre"
      className="flex flex-wrap items-center gap-2 border-t border-stone-800 bg-stone-900 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      {collapsible && (
        <Button
          variant="outline"
          className={plain}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          Comandos
        </Button>
      )}
      {showCommands && (
        <>
          <Button variant="outline" className={plain} onClick={onOpenTest}>
            Solicitar Teste
          </Button>
          {activeCombat ? (
            <>
              <Button
                disabled={saving}
                className="min-h-11"
                onClick={() => runOnce(nextTurn, 'Erro ao avançar o turno:')}
              >
                Próximo Turno
              </Button>
              <Button
                variant="destructive"
                disabled={saving}
                className="min-h-11"
                onClick={() => runOnce(endCombat, 'Erro ao finalizar o combate:')}
              >
                Finalizar Combate
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="min-h-11 border-red-500 text-red-500 hover:bg-red-500 hover:text-stone-100"
              onClick={onOpenCombat}
            >
              <span aria-hidden="true">⚔️</span> Iniciar Combate
            </Button>
          )}
          <Button variant="outline" className={plain} onClick={onAdvanceTime}>
            <span aria-hidden="true">⏳</span> Avançar Tempo
          </Button>
          <Button variant="outline" className={plain} onClick={onOpenRest}>
            Descanso
          </Button>
        </>
      )}
      {npcs.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-stone-300">
          Agir como
          <select
            value={actingAs ?? ''}
            disabled={actAsLocked}
            onChange={(e) => onActAs?.(e.target.value || undefined)}
            className="min-h-11 rounded-md border border-stone-600 bg-stone-900 px-2 text-sm text-stone-100 disabled:opacity-60"
          >
            <option value="">Ninguém</option>
            {npcs.map((npc) => (
              <option key={npc.id} value={npc.id}>
                {npc.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {showCommands && (
        <Button variant="outline" className={`${plain} ml-auto`} onClick={onOpenDice}>
          <span aria-hidden="true">🎲</span> Dados
        </Button>
      )}
    </section>
  );
}
