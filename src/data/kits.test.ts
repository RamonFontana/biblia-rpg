// Fixa os itens iniciais e os textos de Sustento conforme docs/criacao-de-personagem.md e
// docs/itens/consumiveis.md (decisão do autor): Odre e Ração são Sustento e não curam; o Caçador
// começa com 20 flechas; Sábio usa o kit do Sacerdote.
import { describe, expect, it } from 'vitest';
import { VOCATION_KIT_ITEMS } from '../features/character-management/api/syncInventory';
import { ITEMS_DB, KITS_DB } from './itemsDb';

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
  it('todo item de kit existe no catálogo', () => {
    const names = new Set(ITEMS_DB.map((i) => i.name));
    for (const [vocation, items] of Object.entries(VOCATION_KIT_ITEMS)) {
      for (const item of items) {
        expect(names.has(item.name), `${vocation}: ${item.name}`).toBe(true);
      }
    }
  });

  it('o Caçador começa com 20 flechas', () => {
    const arrows = VOCATION_KIT_ITEMS['Caçador'].find((i) => i.name === 'Flecha');
    expect(arrows?.quantity).toBe(20);
  });

  it('o Sábio recebe o mesmo que o Sacerdote', () => {
    expect(VOCATION_KIT_ITEMS['Sábio']).toEqual(VOCATION_KIT_ITEMS['Sacerdote']);
    expect(KITS_DB['Sábio']).toEqual(KITS_DB['Sacerdote']);
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
