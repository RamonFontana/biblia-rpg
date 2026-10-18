// @vitest-environment node
//
// As proficiências de armadura e escudo de cada Vocação são as da linha "Proficiências" do doc da
// Vocação (docs/ é a fonte da verdade). A Túnica Sagrada é exclusiva de Sacerdote e Sábio
// (docs/itens/armaduras.md). Divergiu? Registre no ROADMAP e pergunte ao autor qual vale.
import { describe, expect, it } from 'vitest';
import { VOCATION_PROFICIENCIES } from './proficiencies';
import type { ItemCategory } from './schemas';

const ARMOR_CATEGORIES: ItemCategory[] = ['Leve', 'Média', 'Pesada', 'Escudo', 'Sagrada'];

const docs = import.meta.glob('../../docs/vocacoes/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Categorias de armadura e escudo citadas na linha "**Proficiências**:" do doc da Vocação. */
function armorCategoriesInDoc(file: string): ItemCategory[] {
  const text = docs[`../../docs/vocacoes/${file}.md`];
  const line = text.split('\n').find((l) => l.startsWith('- **Proficiências**'));
  if (!line) throw new Error(`${file}.md sem linha de Proficiências`);

  const armors = line.split(/armas/i)[0]; // só a parte das armaduras e escudos
  const found: ItemCategory[] = [];
  if (/todas as armaduras/i.test(armors)) found.push('Leve', 'Média', 'Pesada');
  if (/\bleves\b/i.test(armors)) found.push('Leve');
  if (/\bmédias\b/i.test(armors)) found.push('Média');
  if (/\bpesadas\b/i.test(armors)) found.push('Pesada');
  if (/escudos?/i.test(armors)) found.push('Escudo');
  return [...new Set(found)];
}

const armorOf = (vocation: string) =>
  ARMOR_CATEGORIES.filter(
    (category) => category !== 'Sagrada' && VOCATION_PROFICIENCIES[vocation].includes(category),
  );

describe('proficiências de armadura × docs das Vocações', () => {
  it.each([
    ['Guerreiro', 'guerreiro'],
    ['Caçador', 'cacador'],
    ['Batedor', 'batedor'],
    ['Sacerdote', 'sacerdote'],
  ])('%s: armaduras e escudos iguais ao doc', (vocation, file) => {
    const expected = armorCategoriesInDoc(file);
    expect(expected.length).toBeGreaterThan(0);
    expect(armorOf(vocation).sort()).toEqual([...expected].sort());
  });

  it('o Sábio tem as mesmas proficiências do Sacerdote', () => {
    expect(VOCATION_PROFICIENCIES['Sábio']).toEqual(VOCATION_PROFICIENCIES['Sacerdote']);
  });

  it('só Sacerdote e Sábio usam a armadura Sagrada', () => {
    const withSagrada = Object.entries(VOCATION_PROFICIENCIES)
      .filter(([, categories]) => categories.includes('Sagrada'))
      .map(([vocation]) => vocation)
      .sort();
    expect(withSagrada).toEqual(['Sacerdote', 'Sábio']);
  });
});
