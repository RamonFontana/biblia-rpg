// Gera o SQL do seed da tabela `items` a partir do conteúdo (ADR 0003). A linha guarda identidade
// e exibição; as regras do item o motor lê do conteúdo pelo slug. `category` é o tipo do item
// (Arma, Armadura...), como o app sempre leu; a categoria de proficiência fica só no conteúdo.
import type { ContentItem } from './schemas';

const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;

const textArray = (values: readonly string[] | undefined) =>
  values?.length ? `array[${values.map(quote).join(', ')}]::text[]` : `'{}'::text[]`;

function row(item: ContentItem): string {
  return `  (${[
    quote(item.id),
    quote(item.name),
    quote(item.description),
    quote(item.type),
    String(item.type === 'Consumível'),
    String(item.cost),
    textArray(item.conditionResistances),
  ].join(', ')})`;
}

export function buildItemsSeedSql(items: readonly ContentItem[]): string {
  return `-- Gerado de src/content/items.ts por \`npm run gen:items-seed\`. Não edite à mão.
-- Espelha em \`items\` a identidade e a exibição de cada item do conteúdo (ADR 0003).

insert into public.items
  (slug, name, description, category, is_consumable, price, condition_resistances)
values
${items.map(row).join(',\n')}
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  is_consumable = excluded.is_consumable,
  price = excluded.price,
  condition_resistances = excluded.condition_resistances;
`;
}
