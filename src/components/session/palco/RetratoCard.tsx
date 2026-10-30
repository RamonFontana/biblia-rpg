// O cartão do Retrato, no Painel: PV, Condições e o que se faz com ele (Negociar e Atacar, pelos
// fluxos de hoje). Termos: CONTEXT.md (Retrato).
import { ConditionBadge } from '@/components/conditions/ConditionBadge';
import { CharacterAvatar } from '@/components/ui/CharacterAvatar';
import type { Retrato } from '@/lib/retratos';

export interface RetratoAttack {
  enabled: boolean;
  /** Por que não dá para atacar agora. */
  reason?: string;
}

interface RetratoCardProps {
  retrato: Retrato;
  /** Sem ele, não há Negociar (o alvo está numa troca ou num Teste). */
  onNegotiate?: (retrato: Retrato) => void;
  /** `null` fora do combate: não há Atacar. */
  attack?: RetratoAttack | null;
  onAttack?: (retrato: Retrato) => void;
}

export function RetratoCard({ retrato, onNegotiate, attack = null, onAttack }: RetratoCardProps) {
  const canNegotiate = !!onNegotiate && !retrato.isMe && retrato.kind !== 'enemy';
  const canAttack = !!attack && !retrato.isMe;
  const percent =
    retrato.pvMax > 0 ? Math.min(100, Math.max(0, (retrato.pv / retrato.pvMax) * 100)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <CharacterAvatar
          imageUrl={retrato.imageUrl}
          name={retrato.name}
          className="h-16 w-16 border-2 border-stone-700"
        />
        <div className="min-w-0">
          <h3 className="truncate font-serif text-xl text-stone-100">{retrato.name}</h3>
          {retrato.down && <p className="text-sm font-medium text-red-400">Caído</p>}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-stone-200 tabular-nums">{`${retrato.pv}/${retrato.pvMax} PV`}</p>
        <div
          role="progressbar"
          aria-label="PV"
          aria-valuemin={0}
          aria-valuemax={retrato.pvMax}
          aria-valuenow={retrato.pv}
          className="h-2 w-full overflow-hidden rounded-full bg-stone-700"
        >
          <div
            className="h-full bg-red-600 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {retrato.conditions.length > 0 ? (
        <ul aria-label="Condições" className="flex flex-wrap gap-1">
          {retrato.conditions.map((condition) => (
            <li key={condition.conditionId}>
              <ConditionBadge
                conditionId={condition.conditionId}
                duration={condition.duration ?? undefined}
                readonly
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-stone-500">Sem Condições.</p>
      )}

      {(canNegotiate || canAttack) && (
        <div className="space-y-2 border-t border-stone-800 pt-4">
          {canNegotiate && (
            <button
              type="button"
              onClick={() => onNegotiate?.(retrato)}
              className="h-12 w-full rounded border border-stone-600 text-stone-200 transition-colors hover:bg-stone-800"
            >
              Negociar
            </button>
          )}
          {canAttack && (
            <div className="space-y-1">
              <button
                type="button"
                disabled={!attack?.enabled}
                onClick={() => onAttack?.(retrato)}
                className="h-12 w-full rounded bg-amber-600 font-bold text-stone-900 transition-colors hover:bg-amber-500 disabled:opacity-50"
              >
                Atacar
              </button>
              {!attack?.enabled && attack?.reason && (
                <p className="text-center text-xs font-medium text-red-400">{attack.reason}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
