// Fixa os itens iniciais e os textos de Sustento conforme docs/criacao-de-personagem.md e
// docs/itens/consumiveis.md (decisão do autor): Odre e Ração são Sustento e não curam; o Caçador
// começa com 20 flechas; Sábio usa o kit do Sacerdote.
import { describe, expect, it } from 'vitest';
import { ITEMS_DB } from './items';
import { KITS_DB } from './kits';

const byId = (id: string) => ITEMS_DB.find((i) => i.id === id)!;

describe('Sustento: Odre e Ração', () => {
  it.each(['odre', 'racao'])('%s é Sustento do Descanso Longo e não cura', (id) => {
    const { description } = byId(id);
    expect(description).toMatch(/Sustento/);
    expect(description).toMatch(/Descanso Longo/);
    expect(description).not.toMatch(/Cura/i);
  });
});

describe('itens iniciais por Vocação', () => {
  const quantityOf = (vocation: string, slug: string) =>
    KITS_DB[vocation].items.find((i) => i.slug === slug)?.quantity ?? 1;

  it('o Caçador começa com 20 flechas', () => {
    expect(quantityOf('Caçador', 'flechas')).toBe(20);
  });

  it('o Sábio recebe o mesmo que o Sacerdote', () => {
    expect(KITS_DB['Sábio']).toEqual(KITS_DB['Sacerdote']);
  });

  it.each([
    ['Guerreiro', 'racao', 5, /5 rações/],
    ['Caçador', 'flechas', 20, /20 flechas/],
    ['Batedor', 'adaga', 2, /Duas facas/],
    ['Sacerdote', 'balsamo', 3, /3 Bálsamos/],
  ])('%s: o texto e os itens concordam sobre %s', (vocation, slug, quantity, text) => {
    expect(quantityOf(vocation, slug)).toBe(quantity);
    expect(KITS_DB[vocation].markdown).toMatch(text);
  });
});

describe('textos dos kits', () => {
  it('o kit do Caçador cita as 20 flechas', () => {
    expect(KITS_DB['Caçador'].markdown).toMatch(/20 flechas/);
  });

  it('o kit do Guerreiro cita o Sustento', () => {
    expect(KITS_DB['Guerreiro'].markdown).toMatch(/Sustento/);
  });
});
