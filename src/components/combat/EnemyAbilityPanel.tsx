import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { getCharactersSkills } from '@/data-access/characters';
import {
  describeEnemyEffect,
  enemyAbilityOf,
  type EnemyAbility,
  type EnemySkillLike,
} from '@/domain/enemyAbility';
import type { MasterMark } from '@/domain/testMode';
import { getErrorMessage } from '@/lib/errorMessage';
import { fireEnemyAbility } from '@/services/enemyAbilityService';

interface EnemyRef {
  participantId: string;
  entityId: string;
  name: string;
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
}

interface EnemyWithAbilities extends EnemyRef {
  abilities: EnemyAbility[];
}

/**
 * As Habilidades de inimigo com efeito no jogo (Onda 5, feature 4): o Mestre escolhe a Habilidade
 * e os personagens que ela atinge. O TR chega aos celulares dos jogadores; o NPC jogável é rolado
 * por ele (ADR 0007). Habilidades só com texto ficam na ficha do inimigo.
 */
export function EnemyAbilityPanel({ sessionId, enemies, characters }: Props) {
  const [rows, setRows] = useState<Record<string, { name: string; skills: unknown }>>({});
  const [chosen, setChosen] = useState<{ enemy: EnemyRef; ability: EnemyAbility } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
                  {enemy.abilities.map((ability, index) => (
                    <li
                      key={`${ability.id}-${index}`}
                      className="flex items-start justify-between gap-3 rounded-md border border-stone-800 bg-stone-800/30 p-2"
                    >
                      <div>
                        <p className="text-sm text-stone-200">{ability.name}</p>
                        <p className="text-xs text-stone-400">
                          {describeEnemyEffect(ability.effect)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`Usar ${ability.name} (${enemy.name})`}
                        onClick={() => {
                          setNotice(null);
                          setChosen({ enemy, ability });
                        }}
                      >
                        Usar
                      </Button>
                    </li>
                  ))}
                </ul>
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
