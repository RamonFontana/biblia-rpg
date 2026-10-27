import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CONDITIONS } from '@/content/conditions';
import type { AbilityDefinition } from '@/content/schemas';
import { isSingleTarget } from '@/domain/abilityEffect';
import { getErrorMessage } from '@/lib/errorMessage';
import type { AttackTarget } from '@/lib/attackSetup';
import type { AbilityUseOutcome } from '@/services/abilityService';

interface AbilityUsePanelProps {
  /** A Habilidade, com o efeito de combate. */
  ability: AbilityDefinition;
  /** Os alvos possíveis (já filtrados pelo efeito: inimigos, aliados ou todos). */
  targets: AttackTarget[];
  /** Por que não pode usar agora (turno, espaço, Fé, usos), ou `null`. */
  blockedReason: string | null;
  onUse: (selected: AttackTarget[]) => Promise<AbilityUseOutcome>;
  onClose: () => void;
}

function conditionText(conditionId: string, rounds?: number): string {
  const name = CONDITIONS[conditionId]?.name ?? conditionId;
  if (rounds === undefined) return `${name} até ser removido`;
  return `${name} por ${rounds} ${rounds === 1 ? 'rodada' : 'rodadas'}`;
}

/** O painel de uso de uma Habilidade com efeito de combate (ADR 0007). */
export function AbilityUsePanel({
  ability,
  targets,
  blockedReason,
  onUse,
  onClose,
}: AbilityUsePanelProps) {
  const effect = ability.combatEffect;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<AbilityUseOutcome | null>(null);
  if (!effect) return null;

  const single = isSingleTarget(effect);
  const selected = targets.filter((t) => selectedIds.includes(t.participantId));
  const canUse = !blockedReason && !busy && selected.length > 0;

  const toggle = (id: string, on: boolean) =>
    setSelectedIds((ids) => (on ? [...ids, id] : ids.filter((x) => x !== id)));

  const use = async () => {
    setBusy(true);
    setError(null);
    try {
      setOutcome(await onUse(selected));
    } catch (e) {
      setError(getErrorMessage(e, 'Não foi possível usar a Habilidade.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-amber-600/60">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <CardTitle>
          <h3>{ability.name}</h3>
        </CardTitle>
        <Button size="sm" variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-stone-300">
          O app aplica: {effect.apply.map((a) => conditionText(a.conditionId, a.rounds)).join(', ')}
        </p>
        <p className="text-xs text-stone-400">{ability.effect}</p>

        {outcome ? (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-stone-200">Resultado</h4>
            <ul className="space-y-1 text-sm text-stone-300">
              {outcome.results.map((r) => (
                <li key={r.participantId}>
                  <p>
                    {r.name}:{' '}
                    {r.conditions.length === 0
                      ? 'resistiu'
                      : r.conditions
                          .map((c) => CONDITIONS[c.conditionId]?.name ?? c.conditionId)
                          .join(' e ')}
                  </p>
                  {r.messages.map((m) => (
                    <p key={m} className="text-xs text-amber-400">
                      {m}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        ) : targets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum alvo possível no combate.</p>
        ) : (
          <>
            {single ? (
              <label className="block text-sm text-stone-300">
                Alvo
                <select
                  value={selectedIds[0] ?? ''}
                  onChange={(e) => setSelectedIds(e.target.value ? [e.target.value] : [])}
                  className="mt-1 w-full rounded border border-stone-700 bg-stone-800 px-3 py-2 text-stone-200"
                >
                  <option value="">Escolha...</option>
                  {targets.map((t) => (
                    <option key={t.participantId} value={t.participantId}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <fieldset className="space-y-1">
                <legend className="text-sm text-stone-300">Alvos</legend>
                {targets.map((t) => (
                  <label key={t.participantId} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(t.participantId)}
                      onChange={(e) => toggle(t.participantId, e.target.checked)}
                    />
                    {t.name}
                  </label>
                ))}
              </fieldset>
            )}
            {blockedReason && <p className="text-sm font-medium text-red-400">{blockedReason}</p>}
            {error && (
              <p role="alert" className="text-sm font-medium text-red-400">
                {error}
              </p>
            )}
            <Button onClick={use} disabled={!canUse}>
              Usar Habilidade
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
