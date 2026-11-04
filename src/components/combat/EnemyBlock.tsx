// A seção "Bloco" do cartão do inimigo: ataques e detalhes do Preset (ADR 0012). Só o Mestre a
// monta; sem bloco (inimigo do zero ou antigo) não mostra nada. Termos: CONTEXT.md (Preset).
import { describeEnemyAttack, enemyBlockOf } from '@/domain/enemyBlock';

const DETAIL_LABELS = [
  ['speed', 'Deslocamento'],
  ['proficiencies', 'Perícias'],
  ['senses', 'Sentidos'],
  ['challenge', 'ND / XP'],
] as const;

export function EnemyBlock({ character }: { character: { narrative?: unknown } }) {
  const block = enemyBlockOf(character);
  if (!block) return null;

  return (
    <section aria-label="Bloco" className="space-y-2 border-t border-stone-800 pt-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Bloco</h4>
      {block.attacks.length > 0 && (
        <ul aria-label="Ataques" className="space-y-1">
          {block.attacks.map((attack) => (
            <li key={attack.name} className="text-sm text-stone-300">
              <span className="font-semibold text-amber-500">{attack.name}</span>{' '}
              <span className="text-stone-400">{describeEnemyAttack(attack)}</span>
            </li>
          ))}
        </ul>
      )}
      <dl className="space-y-0.5 text-sm">
        {DETAIL_LABELS.map(([key, label]) =>
          block.details[key] ? (
            <div key={key} className="flex gap-2">
              <dt className="text-stone-500">{label}:</dt>
              <dd className="text-stone-300">{block.details[key]}</dd>
            </div>
          ) : null,
        )}
      </dl>
    </section>
  );
}
