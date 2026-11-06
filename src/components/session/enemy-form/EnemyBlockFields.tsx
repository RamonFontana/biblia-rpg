// As seções recolhidas do formulário de inimigo para o que o Preset traz: Ataques, Detalhes (texto
// livre, só consulta) e Imunidades e bônus de TR (valem no motor). Termos: CONTEXT.md (Preset).
import { Controller, useFieldArray, type UseFormReturn } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { CONDITIONS } from '@/content/conditions';
import type { EnemyFormValues } from './schema';

const ATTRIBUTES = ['for', 'des', 'con', 'int', 'sab', 'car'] as const;
const DETAILS = [
  ['speed', 'Deslocamento'],
  ['proficiencies', 'Perícias'],
  ['senses', 'Sentidos'],
  ['challenge', 'ND / XP'],
] as const;

const input =
  'flex h-8 w-full rounded-md border border-stone-700 bg-stone-800 px-2 py-1 text-xs shadow-sm';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="rounded-md border border-stone-700/60 bg-stone-900/40 p-3">
      <summary className="min-h-8 cursor-pointer text-sm font-medium text-stone-200">
        {title}
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

export function EnemyBlockFields({ form }: { form: UseFormReturn<EnemyFormValues> }) {
  const { register, control } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'attacks' });

  return (
    <div className="space-y-3">
      <Section title="Ataques">
        {fields.length === 0 && (
          <p className="text-xs italic text-stone-500">Nenhum ataque adicionado.</p>
        )}
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-2 rounded-md border border-stone-700/50 p-2">
            <div className="flex gap-2">
              <input
                {...register(`attacks.${index}.name`)}
                aria-label="Nome do ataque"
                placeholder="Nome do ataque"
                className={input}
              />
              <button
                type="button"
                aria-label="Remover ataque"
                onClick={() => remove(index)}
                className="p-1.5 text-stone-400 hover:text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <select
                {...register(`attacks.${index}.mode`)}
                aria-label="Modalidade"
                className={input}
              >
                <option value="melee">Corpo a corpo</option>
                <option value="ranged">À distância</option>
                <option value="both">Ambos</option>
              </select>
              <select
                {...register(`attacks.${index}.attribute`)}
                aria-label="Atributo"
                className={input}
              >
                <option value="for">FOR</option>
                <option value="des">DES</option>
                <option value="finesse">Acuidade</option>
              </select>
              <input
                type="number"
                {...register(`attacks.${index}.hitBonus`, { valueAsNumber: true })}
                aria-label="Bônus de acerto"
                placeholder="Acerto"
                className={input}
              />
              <input
                {...register(`attacks.${index}.reach`)}
                aria-label="Alcance"
                placeholder="Alcance"
                className={input}
              />
              <input
                {...register(`attacks.${index}.damage.dice`)}
                aria-label="Dado de dano"
                placeholder="1d6"
                className={input}
              />
              <input
                type="number"
                {...register(`attacks.${index}.damage.bonus`, { valueAsNumber: true })}
                aria-label="Bônus de dano"
                placeholder="Bônus"
                className={input}
              />
              <input
                {...register(`attacks.${index}.damageType`)}
                aria-label="Tipo de dano"
                placeholder="Tipo de dano"
                className={input}
              />
              <input
                {...register(`attacks.${index}.extra`)}
                aria-label="Texto extra"
                placeholder="Texto extra"
                className={input}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            append({
              name: '',
              mode: 'melee',
              attribute: 'for',
              hitBonus: 0,
              reach: '1,5m',
              damage: { dice: '1d6', bonus: 0 },
              damageType: '',
            })
          }
          className="flex items-center text-xs text-stone-300 hover:text-stone-100"
        >
          <Plus size={14} className="mr-1" /> Adicionar ataque
        </button>
      </Section>

      <Section title="Detalhes">
        {DETAILS.map(([key, label]) => (
          <label key={key} className="grid gap-1 text-xs text-stone-400">
            {label}
            <input {...register(`details.${key}`)} className={input} />
          </label>
        ))}
      </Section>

      <Section title="Imunidades e bônus de TR">
        <Controller
          control={control}
          name="conditionImmunities"
          render={({ field }) => (
            <fieldset className="flex flex-wrap gap-x-4 gap-y-2">
              <legend className="mb-1 text-xs text-stone-400">Imune a</legend>
              {Object.values(CONDITIONS).map((condition) => {
                const selected = field.value ?? [];
                return (
                  <label
                    key={condition.id}
                    className="flex min-h-8 items-center gap-2 text-xs text-stone-300"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(condition.id)}
                      onChange={(e) =>
                        field.onChange(
                          e.target.checked
                            ? [...selected, condition.id]
                            : selected.filter((id) => id !== condition.id),
                        )
                      }
                    />
                    {condition.name}
                  </label>
                );
              })}
            </fieldset>
          )}
        />
        <div className="grid grid-cols-3 gap-2">
          {ATTRIBUTES.map((attr) => (
            <label key={attr} className="grid gap-1 text-xs uppercase text-stone-400">
              TR {attr}
              <input
                type="number"
                {...register(`saveBonuses.${attr}`, {
                  setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)),
                })}
                aria-label={`Bônus de TR ${attr.toUpperCase()}`}
                placeholder="Mod."
                className={input}
              />
            </label>
          ))}
        </div>
      </Section>
    </div>
  );
}
