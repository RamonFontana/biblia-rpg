import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { getCharactersSkills } from '@/data-access/characters';
import {
  abilityStateKey,
  describeEnemyEffect,
  enemyAbilityOf,
  enemyAbilityStatus,
  rollRecharge,
  type EnemyAbility,
  type EnemyAbilityStateMap,
  type EnemySkillLike,
} from '@/domain/enemyAbility';
import type { MasterMark } from '@/domain/testMode';
import { getErrorMessage } from '@/lib/errorMessage';
import { systemRng } from '@/lib/systemRng';
import { fireEnemyAbility, rechargeEnemyAbility } from '@/services/enemyAbilityService';

interface EnemyRef {
  participantId: string;
  entityId: string;
  name: string;
  /** O estado de uso das Habilidades deste inimigo neste combate (usada, em recarga). */
  abilityState?: EnemyAbilityStateMap;
}

interface CharacterRef {
  participantId: string;
  entityId: string;
  entityType: string;
  name: string;
}

interface Props {
  sessionId: string;
  /** Os inimigos de pé no combate. */
  enemies: EnemyRef[];
  /** Os personagens do combate (jogadores e NPCs) que a Habilidade pode mirar. */
  characters: CharacterRef[];
  /** O participante de quem é o turno: no início dele, a Recarga é lançada. */
  currentTurnParticipantId?: string;
}

interface EnemyWithAbilities extends EnemyRef {
  abilities: EnemyAbility[];
}

/**
 * As Habilidades de inimigo com efeito no jogo (Onda 5, feature 4): o Mestre escolhe a Habilidade
 * e os personagens que ela atinge. O TR chega aos celulares dos jogadores; o NPC jogável é rolado
 * por ele (ADR 0007). Habilidades só com texto ficam na ficha do inimigo.
 */
export function EnemyAbilityPanel({
  sessionId,
  enemies,
  characters,
  currentTurnParticipantId,
}: Props) {
  const [rows, setRows] = useState<Record<string, { name: string; skills: unknown }>>({});
  const [chosen, setChosen] = useState<{ enemy: EnemyRef; ability: EnemyAbility } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [d6, setD6] = useState<Record<string, string>>({});
  const [rechargeError, setRechargeError] = useState<string | null>(null);

  // Só os ids interessam à leitura: `enemies` muda de identidade a cada atualização do combate.
  const enemyKey = enemies.map((e) => e.entityId).join(',');
  useEffect(() => {
    let cancelled = false;
    getCharactersSkills(enemyKey ? enemyKey.split(',') : [])
      .then((read) => {
        if (!cancelled) setRows(read);
      })
      .catch((error) => console.error('Erro ao ler as Habilidades dos inimigos:', error));
    return () => {
      cancelled = true;
    };
  }, [enemyKey]);

  const list: EnemyWithAbilities[] = enemies.map((enemy) => {
    const skills = rows[enemy.entityId]?.skills;
    const abilities = Array.isArray(skills)
      ? (skills as EnemySkillLike[]).flatMap((s) => enemyAbilityOf(s) ?? [])
      : [];
    return { ...enemy, abilities };
  });
  const withAbilities = list.filter((e) => e.abilities.length > 0);
  if (withAbilities.length === 0 && !notice) return null;

  const recharge = async (enemy: EnemyWithAbilities, ability: EnemyAbility) => {
    const key = abilityStateKey(ability);
    setRechargeError(null);
    try {
      const back = await rechargeEnemyAbility({
        participantId: enemy.participantId,
        abilityKey: key,
        abilityState: enemy.abilityState ?? {},
        d6: Number(d6[key + enemy.participantId]),
      });
      setNotice(
        back
          ? `${ability.name} voltou: ${enemy.name} pode usá-la de novo.`
          : `${ability.name} continua em Recarga: ${enemy.name} tenta de novo no próximo turno.`,
      );
    } catch (e) {
      setRechargeError(getErrorMessage(e, 'Não foi possível recarregar a Habilidade.'));
    }
  };

  return (
    <section className="space-y-3" aria-label="Habilidades dos inimigos">
      {notice && (
        <p
          role="status"
          className="rounded-md border border-amber-700/50 bg-amber-900/20 p-3 text-sm text-amber-300"
        >
          {notice}
        </p>
      )}
      {withAbilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h3>Habilidades dos inimigos</h3>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {withAbilities.map((enemy) => (
              <div key={enemy.participantId} className="space-y-2">
                <p className="text-sm font-semibold text-stone-200">{enemy.name}</p>
                <ul className="space-y-2">
                  {enemy.abilities.map((ability, index) => {
                    const key = abilityStateKey(ability);
                    const status = enemyAbilityStatus(key, enemy.abilityState);
                    const recharging = enemy.abilityState?.[key] === 'recharging';
                    const draft = d6[key + enemy.participantId] ?? '';
                    const d6Valid = /^[1-6]$/.test(draft);
                    return (
                      <li
                        key={`${ability.id}-${index}`}
                        className="space-y-2 rounded-md border border-stone-800 bg-stone-800/30 p-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-stone-200">{ability.name}</p>
                            <p className="text-xs text-stone-400">
                              {describeEnemyEffect(ability.effect)}
                            </p>
                            {!status.ready && (
                              <p className="text-xs text-amber-400">{status.reason}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`Usar ${ability.name} (${enemy.name})`}
                            disabled={!status.ready}
                            onClick={() => {
                              setNotice(null);
                              setChosen({ enemy, ability });
                            }}
                          >
                            Usar
                          </Button>
                        </div>
                        {recharging && currentTurnParticipantId === enemy.participantId && (
                          <div className="space-y-1 rounded border border-amber-700/50 p-2">
                            <p className="text-xs font-medium text-amber-300">
                              Recarga (5-6): início do turno de {enemy.name}
                            </p>
                            <div className="flex flex-wrap items-end gap-2">
                              <input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={6}
                                aria-label={`d6 da Recarga de ${ability.name} (${enemy.name})`}
                                value={draft}
                                onChange={(e) =>
                                  setD6((current) => ({
                                    ...current,
                                    [key + enemy.participantId]: e.target.value,
                                  }))
                                }
                                className="w-20 rounded border border-stone-700 bg-stone-800 px-2 py-1 text-sm text-stone-200"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                aria-label={`Rolagem Virtual da Recarga (${enemy.name})`}
                                onClick={() =>
                                  setD6((current) => ({
                                    ...current,
                                    [key + enemy.participantId]: String(rollRecharge(systemRng)),
                                  }))
                                }
                              >
                                Rolagem Virtual
                              </Button>
                              <Button
                                size="sm"
                                aria-label={`Recarregar ${ability.name} (${enemy.name})`}
                                disabled={!d6Valid}
                                onClick={() => recharge(enemy, ability)}
                              >
                                Recarregar
                              </Button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {rechargeError && (
                  <p role="alert" className="text-sm font-medium text-red-400">
                    {rechargeError}
                  </p>
                )}
              </div>
            ))}
            {chosen && (
              <TargetPicker
                key={`${chosen.enemy.participantId}-${chosen.ability.id}`}
                sessionId={sessionId}
                enemy={chosen.enemy}
                ability={chosen.ability}
                characters={characters}
                onCancel={() => setChosen(null)}
                onFired={(message) => {
                  setChosen(null);
                  setNotice(message);
                }}
              />
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function TargetPicker({
  sessionId,
  enemy,
  ability,
  characters,
  onCancel,
  onFired,
}: {
  sessionId: string;
  enemy: EnemyRef;
  ability: EnemyAbility;
  characters: CharacterRef[];
  onCancel: () => void;
  onFired: (message: string) => void;
}) {
  const [marks, setMarks] = useState<Record<string, MasterMark | 'off'>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasSave = ability.effect.save !== undefined;

  const picked = characters.filter((c) => marks[c.participantId] !== undefined);

  const fire = async () => {
    setBusy(true);
    setError(null);
    try {
      await fireEnemyAbility({
        sessionId,
        enemyParticipantId: enemy.participantId,
        ability,
        abilityState: enemy.abilityState ?? {},
        targets: picked.map((c) => {
          const mark = marks[c.participantId];
          return { ...c, mark: mark === 'off' || mark === undefined ? null : mark };
        }),
      });
      onFired(
        hasSave
          ? `${ability.name}: o TR foi para os jogadores. Quando responderem, aplique os resultados.`
          : `${ability.name}: aplicada.`,
      );
    } catch (e) {
      setError(getErrorMessage(e, 'Não foi possível usar a Habilidade.'));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-amber-700/50 p-3">
      <h4 className="text-sm font-semibold text-amber-300">
        Alvos de {ability.name} ({enemy.name})
      </h4>
      <ul className="space-y-2">
        {characters.map((c) => {
          const checked = marks[c.participantId] !== undefined;
          return (
            <li key={c.participantId} className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-stone-200">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) =>
                    setMarks((current) => {
                      const next = { ...current };
                      if (e.target.checked) next[c.participantId] = null;
                      else delete next[c.participantId];
                      return next;
                    })
                  }
                />
                {c.name}
              </label>
              {checked && hasSave && c.entityType === 'player' && (
                <select
                  aria-label={`Modalidade de ${c.name}`}
                  value={marks[c.participantId] ?? ''}
                  onChange={(e) =>
                    setMarks((current) => ({
                      ...current,
                      [c.participantId]: (e.target.value || null) as MasterMark,
                    }))
                  }
                  className="rounded border border-stone-700 bg-stone-800 px-2 py-1 text-xs text-stone-200"
                >
                  <option value="">Normal</option>
                  <option value="vantagem">Vantagem</option>
                  <option value="desvantagem">Desvantagem</option>
                </select>
              )}
              {checked && hasSave && c.entityType !== 'player' && (
                <span className="text-xs text-stone-400">você rola o TR de {c.name}</span>
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
      <div className="flex gap-2">
        <Button onClick={fire} disabled={picked.length === 0 || busy}>
          Usar a Habilidade
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
