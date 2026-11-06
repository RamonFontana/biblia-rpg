// O pedido da Fúria Desumana, na tela do Mestre: quando o PV de um inimigo com a passiva chega a 0
// (por qualquer caminho, visto pelo Realtime), o Mestre faz o TR de CON dele. Termos: CONTEXT.md
// (Fúria Desumana, Endemoniado).
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { rollAbilitySaveDice, saveReminder } from '@/domain/abilitySave';
import { furiaPrompt, furiaStateOf } from '@/domain/furiaDesumana';
import { pickCountingDie, type MasterMark } from '@/domain/testMode';
import { getErrorMessage } from '@/lib/errorMessage';
import { systemRng } from '@/lib/systemRng';
import { releaseFuria, resolveFuriaSave } from '@/services/furiaService';

export interface FuriaEnemy {
  participantId: string;
  entityId: string;
  name: string;
  hp: number;
  /** A lista de Habilidades da ficha (jsonb), de onde sai a passiva. */
  skills: unknown;
  /** O `ability_state` do participante, como veio do banco. */
  abilityState: unknown;
}

interface Draft {
  value: string;
  mark: MasterMark;
  virtual?: number[];
}

const validRoll = (value: string) => {
  const n = Number(value);
  return value !== '' && Number.isInteger(n) && n >= 1 && n <= 20;
};

export function FuriaDesumanaPrompt({ enemies }: { enemies: FuriaEnemy[] }) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<{ id: string; text: string }[]>([]);

  // O inimigo com PV de novo libera o próximo pedido de Fúria. Só os que têm um 0 PV tratado
  // pendente de liberar entram na lista; o efeito roda quando essa lista muda, não a cada render.
  const toRelease = enemies.filter(
    (enemy) => enemy.hp > 0 && furiaStateOf(enemy.abilityState).handled,
  );
  const releaseKey = toRelease.map((enemy) => enemy.participantId).join(',');
  const toReleaseRef = useRef(toRelease);
  useEffect(() => {
    toReleaseRef.current = toRelease;
  });
  useEffect(() => {
    for (const enemy of toReleaseRef.current) {
      void releaseFuria(enemy, enemy.hp).catch((e) =>
        console.error('Erro ao liberar a Fúria Desumana:', e),
      );
    }
  }, [releaseKey]);

  const pending = enemies.flatMap((enemy) => {
    const prompt = furiaPrompt({
      skills: enemy.skills,
      hp: enemy.hp,
      state: furiaStateOf(enemy.abilityState),
    });
    return prompt ? [{ enemy, cd: prompt.cd }] : [];
  });

  const draftOf = (id: string): Draft => drafts[id] ?? { value: '', mark: null };
  const update = (id: string, patch: Partial<Draft>) =>
    setDrafts((current) => ({ ...current, [id]: { ...draftOf(id), ...patch } }));

  const rollVirtually = (id: string) => {
    const { mark } = draftOf(id);
    const dice = rollAbilitySaveDice(mark, systemRng);
    update(id, {
      virtual: dice,
      value: String(pickCountingDie(mark ?? 'normal', 'Resistência', dice)),
    });
  };

  const apply = async (enemy: FuriaEnemy) => {
    const draft = draftOf(enemy.participantId);
    setBusy(enemy.participantId);
    setError(null);
    try {
      const result = await resolveFuriaSave(enemy, {
        natural: Number(draft.value),
        mark: draft.mark,
      });
      setNotices((all) => [
        ...all,
        {
          id: `${enemy.participantId}-${all.length}`,
          text: result.passed
            ? `${enemy.name} passou no TR de CON (${result.total} contra CD ${result.cd}) e fica com 1 PV.`
            : `${enemy.name} falhou no TR de CON (${result.total} contra CD ${result.cd}) e segue a 0 PV.`,
        },
      ]);
      setDrafts((current) => ({ ...current, [enemy.participantId]: { value: '', mark: null } }));
    } catch (e) {
      setError(getErrorMessage(e, 'Não foi possível resolver a Fúria Desumana.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {pending.map(({ enemy, cd }) => {
        const draft = draftOf(enemy.participantId);
        const reminder = saveReminder(draft.mark);
        return (
          <Card key={enemy.participantId} className="border-red-700/60" aria-label="Fúria Desumana">
            <CardHeader className="space-y-1">
              <CardTitle>
                <h3>Fúria Desumana</h3>
              </CardTitle>
              <p className="text-sm text-stone-400">
                {enemy.name} caiu a 0 PV · TR de Constituição · CD {cd}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-end gap-2">
                <select
                  aria-label={`Modalidade de ${enemy.name}`}
                  value={draft.mark ?? ''}
                  onChange={(e) =>
                    update(enemy.participantId, {
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
                  aria-label={`d20 de ${enemy.name}`}
                  value={draft.value}
                  onChange={(e) =>
                    update(enemy.participantId, { value: e.target.value, virtual: undefined })
                  }
                  className="w-20 rounded border border-stone-700 bg-stone-800 px-2 py-1 text-sm text-stone-200"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rollVirtually(enemy.participantId)}
                  aria-label={`Rolagem Virtual de ${enemy.name}`}
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
              <Button
                onClick={() => apply(enemy)}
                disabled={!validRoll(draft.value) || busy === enemy.participantId}
              >
                Aplicar Fúria Desumana
              </Button>
            </CardContent>
          </Card>
        );
      })}
      {error && (
        <p role="alert" className="text-sm font-medium text-red-400">
          {error}
        </p>
      )}
      {notices.map((notice) => (
        <div
          key={notice.id}
          role="status"
          className="flex items-center justify-between gap-3 rounded-md border border-stone-700 bg-stone-900 p-3 text-sm text-stone-200"
        >
          <span>{notice.text}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setNotices((all) => all.filter((n) => n.id !== notice.id))}
          >
            Entendi
          </Button>
        </div>
      ))}
    </>
  );
}
