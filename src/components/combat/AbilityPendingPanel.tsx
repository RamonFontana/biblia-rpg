import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import type { CombatAbilityUse, CombatParticipant } from '@/data-access/combat';
import { abilityUseTargets } from '@/domain/abilityEffect';
import {
  rollAbilitySaveDice,
  saveAttributeLabel,
  saveReminder,
  type SaveAttribute,
} from '@/domain/abilitySave';
import { pickCountingDie, type MasterMark } from '@/domain/testMode';
import { getErrorMessage } from '@/lib/errorMessage';
import { systemRng } from '@/lib/systemRng';
import { resolveAbilityUseRolls } from '@/services/abilityService';

interface AbilityPendingPanelProps {
  /** Os usos de Habilidade do combate; só os pendentes (com TR) aparecem aqui. */
  uses: CombatAbilityUse[];
  participants: Pick<CombatParticipant, 'id' | 'entity_id' | 'entity_type'>[];
}

/** O que o Mestre preencheu para um alvo: o d20 que vale, a marca e os dois dados virtuais. */
interface RollDraft {
  value: string;
  mark: MasterMark;
  virtual?: number[];
}

const validRoll = (value: string) => {
  const n = Number(value);
  return value !== '' && Number.isInteger(n) && n >= 1 && n <= 20;
};

/**
 * Os usos de Habilidade que esperam o TR (ADR 0007): o Mestre digita o d20 de cada alvo (ou usa a
 * Rolagem Virtual), marca Vantagem ou Desvantagem e resolve. A Condição entra só em quem falhar.
 */
export function AbilityPendingPanel({ uses, participants }: AbilityPendingPanelProps) {
  const pending = uses.filter((use) => use.status === 'pending');
  if (pending.length === 0) return null;

  return (
    <section className="space-y-3" aria-label="TRs de Habilidades pendentes">
      {pending.map((use) => (
        <PendingUse key={use.id} use={use} participants={participants} />
      ))}
    </section>
  );
}

function PendingUse({
  use,
  participants,
}: {
  use: CombatAbilityUse;
  participants: AbilityPendingPanelProps['participants'];
}) {
  const targets = abilityUseTargets(use.targets);
  const [drafts, setDrafts] = useState<Record<string, RollDraft>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attribute = use.save_attribute as SaveAttribute | null;

  const draftOf = (id: string): RollDraft => drafts[id] ?? { value: '', mark: null };
  const update = (id: string, patch: Partial<RollDraft>) =>
    setDrafts((current) => ({ ...current, [id]: { ...draftOf(id), ...patch } }));

  const ready = targets.every((t) => validRoll(draftOf(t.participantId).value));

  const rollVirtually = (id: string) => {
    const { mark } = draftOf(id);
    const dice = rollAbilitySaveDice(mark, systemRng);
    update(id, {
      virtual: dice,
      value: String(pickCountingDie(mark ?? 'normal', 'Resistência', dice)),
    });
  };

  const resolve = async () => {
    setBusy(true);
    setError(null);
    try {
      await resolveAbilityUseRolls({
        use,
        participants,
        rolls: targets.map((t) => ({
          participantId: t.participantId,
          natural: Number(draftOf(t.participantId).value),
          mark: draftOf(t.participantId).mark,
        })),
      });
    } catch (e) {
      setError(getErrorMessage(e, 'Não foi possível resolver o TR.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-amber-600/60">
      <CardHeader className="space-y-1">
        <CardTitle>
          <h3>{use.ability_name}</h3>
        </CardTitle>
        <p className="text-sm text-stone-400">
          {use.user_name} usou
          {attribute && use.cd !== null && (
            <>
              {' · '}TR de {saveAttributeLabel(attribute)} · CD {use.cd}
            </>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-3">
          {targets.map((t) => {
            const draft = draftOf(t.participantId);
            const reminder = saveReminder(draft.mark);
            return (
              <li key={t.participantId} className="space-y-1">
                <p className="text-sm font-medium text-stone-200">{t.name}</p>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="text-xs text-stone-400">
                    <span className="sr-only">Modalidade de {t.name}</span>
                    <select
                      aria-label={`Modalidade de ${t.name}`}
                      value={draft.mark ?? ''}
                      onChange={(e) =>
                        update(t.participantId, {
                          mark: (e.target.value || null) as MasterMark,
                          virtual: undefined,
                        })
                      }
                      className="rounded border border-stone-700 bg-stone-800 px-2 py-1 text-sm text-stone-200"
                    >
                      <option value="">Normal</option>
                      <option value="vantagem">Vantagem</option>
                      <option value="desvantagem">Desvantagem</option>
                    </select>
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    aria-label={`d20 de ${t.name}`}
                    value={draft.value}
                    onChange={(e) =>
                      update(t.participantId, { value: e.target.value, virtual: undefined })
                    }
                    className="w-20 rounded border border-stone-700 bg-stone-800 px-2 py-1 text-sm text-stone-200"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rollVirtually(t.participantId)}
                    aria-label={`Rolagem Virtual de ${t.name}`}
                  >
                    Rolagem Virtual
                  </Button>
                </div>
                {reminder && <p className="text-xs text-amber-400">{reminder}</p>}
                {draft.virtual && draft.virtual.length > 0 && (
                  <p className="text-xs text-stone-400">
                    {draft.virtual.length === 1
                      ? `Rolou ${draft.virtual[0]}.`
                      : `Rolou ${draft.virtual.join(' e ')}, vale ${draft.value}.`}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        {error && (
          <p role="alert" className="text-sm font-medium text-red-400">
            {error}
          </p>
        )}
        <Button onClick={resolve} disabled={!ready || busy}>
          Resolver TR
        </Button>
      </CardContent>
    </Card>
  );
}
