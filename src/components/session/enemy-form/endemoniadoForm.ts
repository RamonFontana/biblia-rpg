// A ponte entre os valores do formulário de inimigo e o Template Endemoniado do motor
// (src/domain/enemyTemplate.ts). O Template roda sobre o que o Mestre vê no formulário, e ele edita
// o resultado; nada é recalculado depois da criação (ADR 0012).
import type { EnemyPresetDefinition } from '@/content/schemas';
import { applyEndemoniado, type TemplateEnemy } from '@/domain/enemyTemplate';
import type { EnemyFormValues } from './schema';

type FormAttributes = NonNullable<EnemyFormValues['attributes']>;

/** Os valores que o Template muda, na forma do formulário. */
export type EndemoniadoFormPatch = Pick<
  EnemyFormValues,
  | 'name'
  | 'vocation'
  | 'hpMax'
  | 'hpCurrent'
  | 'attributes'
  | 'attacks'
  | 'skills'
  | 'conditionImmunities'
  | 'saveBonuses'
  | 'details'
  | 'endemoniado'
>;

/** Os valores do formulário que o Template pode mudar (para restaurar ao desligar). */
export function patchOf(values: EnemyFormValues): EndemoniadoFormPatch {
  return structuredClone({
    name: values.name,
    vocation: values.vocation,
    hpMax: values.hpMax,
    hpCurrent: values.hpCurrent,
    attributes: values.attributes,
    attacks: values.attacks,
    skills: values.skills,
    conditionImmunities: values.conditionImmunities,
    saveBonuses: values.saveBonuses,
    details: values.details,
    endemoniado: values.endemoniado,
  });
}

/** O dado de vida só vale enquanto o PV é o do Preset: se o Mestre o editou, o PV não é recalculado. */
function hitDiceOf(values: EnemyFormValues, preset: EnemyPresetDefinition | undefined) {
  return preset && values.hpMax === preset.hp ? preset.hitDice : undefined;
}

export function templateInputOf(
  values: EnemyFormValues,
  preset: EnemyPresetDefinition | undefined,
): TemplateEnemy {
  return {
    name: values.name,
    nameGender: preset?.nameGender ?? 'm',
    creatureType: values.vocation ?? '',
    hp: values.hpMax,
    hitDice: hitDiceOf(values, preset),
    attributes: values.attributes as FormAttributes,
    attacks: structuredClone(values.attacks ?? []),
    abilities: (values.skills ?? []).map(({ name, description, libraryId }) => ({
      name,
      description,
      libraryId,
    })),
    conditionImmunities: [...(values.conditionImmunities ?? [])],
    saveBonuses: values.saveBonuses && { ...values.saveBonuses },
    proficiencies: values.details?.proficiencies,
    endemoniado: preset?.endemoniado,
  };
}

/** Aplica o Template aos valores do formulário e devolve o que mudar nele. */
export function endemoniadoPatch(
  values: EnemyFormValues,
  preset: EnemyPresetDefinition | undefined,
): EndemoniadoFormPatch {
  const result = applyEndemoniado(templateInputOf(values, preset));
  return {
    name: result.name,
    vocation: result.creatureType,
    hpMax: result.hp,
    hpCurrent: result.hp,
    attributes: result.attributes,
    attacks: result.attacks,
    skills: result.abilities,
    conditionImmunities: result.conditionImmunities,
    saveBonuses: result.saveBonuses,
    details: { ...values.details, proficiencies: result.proficiencies },
    endemoniado: true,
  };
}
