import { getFaithState, type FaithStateId, type FaithStats } from '@/domain/faith';

// O nome do estado vai sempre em texto; a cor só reforça (docs/DESIGN.md).
const COLORS: Record<FaithStateId, string> = {
  inabalavel: 'border-green-700/50 bg-green-900/30 text-green-400',
  comum: 'border-stone-600 bg-stone-800 text-stone-300',
  abalado: 'border-amber-500/30 bg-amber-500/20 text-amber-400',
  vulneravel: 'border-red-700/50 bg-red-900/30 text-red-400',
  ruptura: 'border-red-700/50 bg-red-900/30 text-red-400',
};

interface FaithStateBadgeProps {
  stats: FaithStats | null | undefined;
  /** O Mestre no Vulnerável ganha o lembrete de pedir Testemunho. */
  viewerIsGM?: boolean;
}

/** Selo do Estado de Fé (pela Fé Atual), com o efeito do doc na dica. */
export function FaithStateBadge({ stats, viewerIsGM = false }: FaithStateBadgeProps) {
  const state = getFaithState(stats);
  const reminder = viewerIsGM && state.id === 'vulneravel' ? ' Peça um Testemunho.' : '';
  return (
    <span
      title={`${state.effect}${reminder}`}
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${COLORS[state.id]}`}
    >
      {state.label}
    </span>
  );
}
