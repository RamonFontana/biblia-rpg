import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CONDITIONS } from '@/content/conditions';
import type { AbilityDefinition } from '@/content/schemas';
import type { CombatAbilityUse } from '@/data-access/combat';
import {
  abilityUseTargets,
  describeRemoval,
  hasRemoval,
  isSingleTarget,
  removableConditions,
  removalBlock,
  type RemovalChoices,
} from '@/domain/abilityEffect';
import { saveAttributeLabel } from '@/domain/abilitySave';
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
  /** A CD da Habilidade do personagem, quando ela impõe um TR. */
  cd?: number;
  /** `removals` só vem nas Habilidades que tiram Condição: a que o jogador escolheu por alvo. */
  onUse: (selected: AttackTarget[], removals?: RemovalChoices) => Promise<AbilityUseOutcome>;
  onClose: () => void;
  /** O uso gravado, ao vivo: quando o Mestre lança o TR, o resultado chega por aqui. */
  liveUse?: CombatAbilityUse;
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
  cd,
  onUse,
  onClose,
  liveUse,
}: AbilityUsePanelProps) {
  const effect = ability.combatEffect;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [choices, setChoices] = useState<RemovalChoices>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<AbilityUseOutcome | null>(null);
  if (!effect) return null;

  const single = isSingleTarget(effect);
  const selected = targets.filter((t) => selectedIds.includes(t.participantId));
  const removing = hasRemoval(effect);
  // Só as escolhas dos alvos que continuam marcados.
  const selectedChoices: RemovalChoices = Object.fromEntries(
    selected.flatMap((t) =>
      choices[t.participantId] ? [[t.participantId, choices[t.participantId]]] : [],
    ),
  );
  const incomplete = removing && removalBlock(effect, selected, selectedChoices) !== null;
  const canUse = !blockedReason && !busy && selected.length > 0 && !incomplete;

  const toggle = (id: string, on: boolean) =>
    setSelectedIds((ids) => (on ? [...ids, id] : ids.filter((x) => x !== id)));

  const use = async () => {
    setBusy(true);
    setError(null);
    try {
      setOutcome(await (removing ? onUse(selected, selectedChoices) : onUse(selected)));
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
        {effect.apply && (
          <p className="text-sm text-stone-300">
            O app aplica:{' '}
            {effect.apply.map((a) => conditionText(a.conditionId, a.rounds)).join(', ')}
          </p>
        )}
        {removing && (
          <>
            <p className="text-sm text-stone-300">
              O app tira: {describeRemoval(effect)}
              {effect.remove?.mode === 'per_target' ? '' : ' do aliado'}
            </p>
            <p className="text-xs text-stone-400">
              Cura, dano e bônus do texto ficam com o Mestre.
            </p>
          </>
        )}
        {effect.save && (
          <p className="text-sm text-stone-300">
            TR de {saveAttributeLabel(effect.save.attribute)} dos alvos
            {cd !== undefined && ` (CD ${cd})`}: a Condição só entra em quem falhar.
          </p>
        )}
        <p className="text-xs text-stone-400">{ability.effect}</p>

        {outcome?.pending ? (
          <PendingResult outcome={outcome} liveUse={liveUse} />
        ) : outcome ? (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-stone-200">Resultado</h4>
            <ul className="space-y-1 text-sm text-stone-300">
              {outcome.results.map((r) => (
                <li key={r.participantId}>
                  {r.removed !== undefined ? (
                    <p>
                      {r.name}:{' '}
                      {r.removed.length > 0
                        ? `deixou de estar ${r.removed.map((id) => CONDITIONS[id]?.name ?? id).join(' e ')}`
                        : (r.messages[0] ?? 'não tinha Condição a remover')}
                    </p>
                  ) : (
                    <>
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
                    </>
                  )}
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
            {removing &&
              selected.map((t) => {
                const options = removableConditions(effect, t.conditionIds);
                if (options.length === 0) {
                  return (
                    <p key={t.participantId} className="text-sm text-amber-400">
                      {t.name} não tem Condição que esta Habilidade tire.
                    </p>
                  );
                }
                if (effect.remove?.mode === 'fixed') {
                  return (
                    <p key={t.participantId} className="text-sm text-stone-300">
                      Sai de {t.name}: {CONDITIONS[options[0]]?.name ?? options[0]}
                    </p>
                  );
                }
                return (
                  <label key={t.participantId} className="block text-sm text-stone-300">
                    Condição que sai de {t.name}
                    <select
                      value={choices[t.participantId] ?? ''}
                      onChange={(e) =>
                        setChoices((current) => ({ ...current, [t.participantId]: e.target.value }))
                      }
                      className="mt-1 w-full rounded border border-stone-700 bg-stone-800 px-3 py-2 text-stone-200"
                    >
                      <option value="">Escolha...</option>
                      {options.map((id) => (
                        <option key={id} value={id}>
                          {CONDITIONS[id]?.name ?? id}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
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

/** O uso com TR: espera o Mestre lançar os testes e depois mostra o resultado de cada alvo. */
function PendingResult({
  outcome,
  liveUse,
}: {
  outcome: AbilityUseOutcome;
  liveUse: CombatAbilityUse | undefined;
}) {
  const live = liveUse?.id === outcome.id ? liveUse : undefined;
  if (live?.status === 'expired') {
    return (
      <p className="text-sm text-stone-300">O uso não teve efeito: o combate acabou antes do TR.</p>
    );
  }
  if (live?.status === 'resolved') {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-stone-200">Resultado</h4>
        <ul className="space-y-1 text-sm text-stone-300">
          {abilityUseTargets(live.targets).map((t) => {
            const result =
              t.conditionIds.length > 0
                ? t.conditionIds.map((id) => CONDITIONS[id]?.name ?? id).join(' e ')
                : t.failed
                  ? 'falhou no TR, mas resistiu à Condição'
                  : 'passou no TR';
            return (
              <li key={t.participantId}>
                {t.name}: {result} (d20 {t.natural}, total {t.total})
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  return (
    <p className="text-sm text-stone-300">
      Aguardando o Mestre lançar o TR de {saveAttributeLabel(outcome.pending!.attribute)} (CD{' '}
      {outcome.pending!.cd}).
    </p>
  );
}
