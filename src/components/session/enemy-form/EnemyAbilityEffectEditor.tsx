// O efeito de uma Habilidade de inimigo personalizada (Onda 5, feature 4): o TR dos personagens
// (atributo e CD), a Condição e a duração, a Fé que perdem e o uso. A biblioteca do bestiário cobre
// os casos comuns; aqui o Mestre inventa o resto. Termos: CONTEXT.md (Habilidade de inimigo).
import { useState } from 'react';
import { CONDITIONS } from '@/content/conditions';
import { enemyAbilityEffectSchema, type EnemyAbilityEffect } from '@/content/schemas';
import { saveAttributeLabel, type SaveAttribute } from '@/domain/abilitySave';

interface Props {
  value: EnemyAbilityEffect | undefined;
  /** O efeito válido, ou `undefined` (sem efeito ou ainda incompleto: a Habilidade fica só texto). */
  onChange: (effect: EnemyAbilityEffect | undefined) => void;
}

interface Draft {
  enabled: boolean;
  attribute: SaveAttribute | '';
  cd: string;
  conditionId: string;
  rounds: string;
  faithSides: '' | '4' | '6';
  usage: EnemyAbilityEffect['usage'];
}

const ATTRIBUTES: SaveAttribute[] = ['for', 'des', 'con', 'int', 'sab', 'car'];

const fieldClass =
  'flex h-8 w-full rounded-md border border-stone-700 bg-stone-800 px-2 py-1 text-xs shadow-sm';

function draftOf(value: EnemyAbilityEffect | undefined): Draft {
  return {
    enabled: value !== undefined,
    attribute: value?.save?.attribute ?? '',
    cd: String(value?.save?.cd ?? 13),
    conditionId: value?.apply?.[0]?.conditionId ?? '',
    rounds: value?.apply?.[0]?.rounds ? String(value.apply[0].rounds) : '',
    faithSides: value?.faithLoss ? (String(value.faithLoss.sides) as '4' | '6') : '',
    usage: value?.usage ?? 'unlimited',
  };
}

function effectOf(draft: Draft): EnemyAbilityEffect | undefined {
  if (!draft.enabled) return undefined;
  const candidate = {
    usage: draft.usage,
    ...(draft.attribute && { save: { attribute: draft.attribute, cd: Number(draft.cd) } }),
    ...(draft.conditionId && {
      apply: [
        {
          conditionId: draft.conditionId,
          ...(draft.rounds && { rounds: Number(draft.rounds) }),
        },
      ],
    }),
    ...(draft.faithSides && { faithLoss: { sides: Number(draft.faithSides) } }),
  };
  const parsed = enemyAbilityEffectSchema.safeParse(candidate);
  return parsed.success ? parsed.data : undefined;
}

export function EnemyAbilityEffectEditor({ value, onChange }: Props) {
  const [draft, setDraft] = useState<Draft>(() => draftOf(value));

  const update = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    onChange(effectOf(next));
  };

  const incomplete = draft.enabled && effectOf(draft) === undefined;

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs text-stone-300">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(e) => update({ enabled: e.target.checked })}
        />
        Aplicar efeito no jogo
      </label>
      {draft.enabled && (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-stone-400">
            Atributo do TR
            <select
              className={fieldClass}
              value={draft.attribute}
              onChange={(e) => update({ attribute: e.target.value as SaveAttribute | '' })}
            >
              <option value="">Sem TR</option>
              {ATTRIBUTES.map((a) => (
                <option key={a} value={a}>
                  {saveAttributeLabel(a)}
                </option>
              ))}
            </select>
          </label>
          {draft.attribute && (
            <label className="text-xs text-stone-400">
              CD do TR
              <input
                type="number"
                min={1}
                max={40}
                className={fieldClass}
                value={draft.cd}
                onChange={(e) => update({ cd: e.target.value })}
              />
            </label>
          )}
          <label className="text-xs text-stone-400">
            Condição aplicada
            <select
              className={fieldClass}
              value={draft.conditionId}
              onChange={(e) => update({ conditionId: e.target.value })}
            >
              <option value="">Nenhuma</option>
              {Object.values(CONDITIONS).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {draft.conditionId && (
            <label className="text-xs text-stone-400">
              Duração em rodadas
              <input
                type="number"
                min={1}
                max={100}
                placeholder="até ser removida"
                className={fieldClass}
                value={draft.rounds}
                onChange={(e) => update({ rounds: e.target.value })}
              />
            </label>
          )}
          <label className="text-xs text-stone-400">
            Dado de Fé perdida
            <select
              className={fieldClass}
              value={draft.faithSides}
              onChange={(e) => update({ faithSides: e.target.value as Draft['faithSides'] })}
            >
              <option value="">Nenhuma</option>
              <option value="4">1d4</option>
              <option value="6">1d6</option>
            </select>
          </label>
          <label className="text-xs text-stone-400">
            Uso
            <select
              className={fieldClass}
              value={draft.usage}
              onChange={(e) => update({ usage: e.target.value as Draft['usage'] })}
            >
              <option value="unlimited">Sem limite</option>
              <option value="per_combat">1 por combate</option>
              <option value="recharge">Recarga 5-6</option>
            </select>
          </label>
        </div>
      )}
      {incomplete && (
        <p className="text-xs text-amber-400">
          Escolha uma Condição ou a perda de Fé (e uma CD de 1 a 40) para o efeito valer.
        </p>
      )}
    </div>
  );
}
