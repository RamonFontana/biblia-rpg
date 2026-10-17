// Fixa os itens iniciais e os textos de Sustento conforme docs/criacao-de-personagem.md e
// docs/itens/consumiveis.md (decisão do autor): Odre e Ração são Sustento e não curam; o Caçador
// começa com 20 flechas; Sábio usa o kit do Sacerdote.
import { describe, expect, it, vi } from 'vitest';

// syncInventory cria o cliente do Supabase, que exige variáveis de ambiente (ausentes no CI).
vi.mock('../lib/supabase', () => ({ supabase: {} }));

import { VOCATION_KIT_ITEMS } from '../features/character-management/api/syncInventory';
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
  it('todo item de kit existe no catálogo', () => {
    const slugs = new Set(ITEMS_DB.map((i) => i.id));
    for (const [vocation, items] of Object.entries(VOCATION_KIT_ITEMS)) {
      for (const item of items) {
        expect(slugs.has(item.slug), `${vocation}: ${item.slug}`).toBe(true);
      }
    }
  });

  it('o Caçador começa com 20 flechas', () => {
    const arrows = VOCATION_KIT_ITEMS['Caçador'].find((i) => i.slug === 'flechas');
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
