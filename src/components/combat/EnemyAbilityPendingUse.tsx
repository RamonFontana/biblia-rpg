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
import { checkFaithDie, enemyEffectOfUse, rollEnemyFaithDie } from '@/domain/enemyAbility';
import { pickCountingDie, type MasterMark } from '@/domain/testMode';
import { useTestResults } from '@/hooks/useTestResults';
import { getErrorMessage } from '@/lib/errorMessage';
import { systemRng } from '@/lib/systemRng';
import { resolveEnemyAbilityUse } from '@/services/enemyAbilityService';

interface Props {
  use: CombatAbilityUse;
  participants: Pick<CombatParticipant, 'id' | 'entity_id' | 'entity_type'>[];
}

interface RollDraft {
  value: string;
  mark: MasterMark;
  virtual?: number[];
}

/** O texto do campo de Fé vira número; vazio ou texto que não é número vira `''`. */
const faithValue = (text: string): number | '' => (text === '' ? '' : Number(text));

const validRoll = (value: string) => {
  const n = Number(value);
  return value !== '' && Number.isInteger(n) && n >= 1 && n <= 20;
};

/**
 * Um uso pendente de Habilidade de inimigo (ADR 0007). Os jogadores fazem o TR no celular, pelo
 * Teste de sessão; o Mestre acompanha quem respondeu e aplica os resultados. O NPC jogável não tem
 * celular: o Mestre digita o d20 dele. Quem não respondeu fica sem efeito.
 */
export function EnemyAbilityPendingUse({ use, participants }: Props) {
  const targets = abilityUseTargets(use.targets);
  const results = useTestResults(use.test_id);
  const [drafts, setDrafts] = useState<Record<string, RollDraft>>({});
  const [faithDrafts, setFaithDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attribute = use.save_attribute as SaveAttribute | null;

  const isPlayer = (participantId: string) =>
    participants.find((p) => p.id === participantId)?.entity_type === 'player';
  const npcTargets = targets.filter((t) => !isPlayer(t.participantId));
  const draftOf = (id: string): RollDraft => drafts[id] ?? { value: '', mark: null };
  const update = (id: string, patch: Partial<RollDraft>) =>
    setDrafts((current) => ({ ...current, [id]: { ...draftOf(id), ...patch } }));
  const effect = enemyEffectOfUse(use);
  const faithSides = effect?.faithLoss?.sides ?? null;
  const faithOf = (id: string) => faithDrafts[id] ?? '';
  const faithValid = (id: string) =>
    faithSides !== null && checkFaithDie(faithValue(faithOf(id)), faithSides) === null;

  // Quem já se sabe que falhou: o jogador que respondeu e foi reprovado. O NPC jogável só se sabe
  // pelo d20 que o Mestre lança, então o campo dele fica aberto e a falta é cobrada pelo serviço.
  const knownFailed = (participantId: string): boolean => {
    const entityId = participants.find((p) => p.id === participantId)?.entity_id;
    const row = results.find((r) => r.character_id === entityId);
    return row?.status === 'submitted' && row.is_approved === false;
  };
  const showsFaithDie = (participantId: string) =>
    faithSides !== null && (isPlayer(participantId) ? knownFailed(participantId) : true);
  const faithReady = targets.every(
    (t) =>
      faithSides === null ||
      !isPlayer(t.participantId) ||
      !knownFailed(t.participantId) ||
      faithValid(t.participantId),
  );
  const ready = npcTargets.every((t) => validRoll(draftOf(t.participantId).value)) && faithReady;

  const statusOf = (participantId: string): string => {
    const entityId = participants.find((p) => p.id === participantId)?.entity_id;
    const row = results.find((r) => r.character_id === entityId);
    if (!row || row.status !== 'submitted') return 'aguardando o jogador';
    const verdict = row.is_approved ? 'passou' : 'falhou';
    return `${verdict} (${row.result_value} contra CD ${use.cd})`;
  };

  const rollVirtually = (id: string) => {
    const { mark } = draftOf(id);
    const dice = rollAbilitySaveDice(mark, systemRng);
    update(id, {
      virtual: dice,
      value: String(pickCountingDie(mark ?? 'normal', 'Resistência', dice)),
    });
  };

  const rollFaithVirtually = (id: string) => {
    if (faithSides === null) return;
    setFaithDrafts((current) => ({
      ...current,
      [id]: String(rollEnemyFaithDie(faithSides, systemRng)),
    }));
  };

  const apply = async () => {
    setBusy(true);
    setError(null);
    try {
      await resolveEnemyAbilityUse({
        use,
        participants,
        npcRolls: npcTargets.map((t) => ({
          participantId: t.participantId,
          natural: Number(draftOf(t.participantId).value),
          mark: draftOf(t.participantId).mark,
        })),
        faithRolls: targets.flatMap((t) =>
          showsFaithDie(t.participantId) && faithValid(t.participantId)
            ? [{ participantId: t.participantId, value: Number(faithOf(t.participantId)) }]
            : [],
        ),
      });
    } catch (e) {
      setError(getErrorMessage(e, 'Não foi possível aplicar os resultados.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-red-700/60">
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
            if (isPlayer(t.participantId)) {
              return (
                <li key={t.participantId} className="space-y-1 text-sm text-stone-200">
                  <p>
                    {t.name}: {statusOf(t.participantId)}
                  </p>
                  {showsFaithDie(t.participantId) && faithSides !== null && (
                    <FaithDie
                      name={t.name}
                      sides={faithSides}
                      value={faithOf(t.participantId)}
                      onChange={(value) =>
                        setFaithDrafts((current) => ({ ...current, [t.participantId]: value }))
                      }
                      onRoll={() => rollFaithVirtually(t.participantId)}
                    />
                  )}
                </li>
              );
            }
            const draft = draftOf(t.participantId);
            const reminder = saveReminder(draft.mark);
            return (
              <li key={t.participantId} className="space-y-1">
                <p className="text-sm font-medium text-stone-200">{t.name} (você rola o TR)</p>
                <div className="flex flex-wrap items-end gap-2">
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
                {faithSides !== null && (
                  <FaithDie
                    name={t.name}
                    sides={faithSides}
                    value={faithOf(t.participantId)}
                    hint="só vale se falhar"
                    onChange={(value) =>
                      setFaithDrafts((current) => ({ ...current, [t.participantId]: value }))
                    }
                    onRoll={() => rollFaithVirtually(t.participantId)}
                  />
                )}
              </li>
            );
          })}
        </ul>
        {effect?.reminder && <p className="text-xs text-amber-400">Lembrete: {effect.reminder}</p>}
        <p className="text-xs text-stone-500">
          Quem não responder fica sem efeito quando você aplicar os resultados.
        </p>
        {error && (
          <p role="alert" className="text-sm font-medium text-red-400">
            {error}
          </p>
        )}
        <Button onClick={apply} disabled={!ready || busy}>
          Aplicar resultados
        </Button>
      </CardContent>
    </Card>
  );
}

/** O dado de Fé (1d4 ou 1d6) de um alvo que falhou: digitado, ou pela Rolagem Virtual. */
function FaithDie({
  name,
  sides,
  value,
  hint,
  onChange,
  onRoll,
}: {
  name: string;
  sides: 4 | 6;
  value: string;
  hint?: string;
  onChange: (value: string) => void;
  onRoll: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={sides}
        aria-label={`Dado de Fé de ${name} (1d${sides})`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 rounded border border-stone-700 bg-stone-800 px-2 py-1 text-sm text-stone-200"
      />
      <Button
        size="sm"
        variant="outline"
        onClick={onRoll}
        aria-label={`Rolagem Virtual de Fé de ${name}`}
      >
        Rolagem Virtual
      </Button>
      <span className="text-xs text-stone-400">
        perde 1d{sides} de Fé{hint ? ` (${hint})` : ''}
      </span>
    </div>
  );
}
