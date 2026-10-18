// O que o inventário e os slots mostram de armadura: a CA do próprio item (uma fórmula só) e,
// no elmo, que ele não dá CA e qual Resistência a Condição ele dá.
// Decisões: ROADMAP.md, Onda 3 (passo 5). Termos: CONTEXT.md (CA, Elmo).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EquipmentSlots } from './EquipmentSlots';
import { InventoryList } from './InventoryList';

afterEach(cleanup);

// Linha de character_items com o item aninhado, como o app carrega (effects vazio, como em produção).
const row = (id: string, slug: string, name: string, level = 1) => ({
  id,
  item_id: `item-${slug}`,
  quantity: 1,
  level,
  items: { slug, name, category: 'Armadura', effects: {}, description: '' },
});

describe('EquipmentSlots', () => {
  const inventory = [
    row('h', 'elmo_bronze', 'Elmo de Bronze Fechado', 3),
    row('b', 'cota_escamas', 'Cota de Escamas de Bronze', 2),
    row('s', 'escudo', 'Escudo (Madeira/Bronze)', 2),
  ];

  const renderSlots = (equipment: object) =>
    render(
      <EquipmentSlots
        equipment={{ head: null, body: null, mainHand: null, offHand: null, ...equipment }}
        inventoryItems={inventory}
      />,
    );

  it('o elmo não mostra CA e mostra a Resistência a Condição que dá', () => {
    renderSlots({ head: 'h' });
    expect(screen.getByText('Não dá CA')).toBeTruthy();
    expect(screen.getByText('Resiste: Atordoado')).toBeTruthy();
    expect(screen.getByText('Resiste: Cego')).toBeTruthy();
    expect(screen.queryByText(/🛡️/)).toBeNull();
  });

  it('a armadura mostra a CA do item com a regra da DES e a Qualidade', () => {
    renderSlots({ body: 'b' });
    expect(screen.getByText(/CA 15 \+ DES \(máx \+2\)/)).toBeTruthy(); // 14 + 1 (Qualidade 2)
  });

  it('o escudo mostra o bônus com a Qualidade', () => {
    renderSlots({ offHand: 's' });
    expect(screen.getByText(/CA \+3/)).toBeTruthy(); // 2 + 1 (Qualidade 2)
  });
});

describe('InventoryList', () => {
  const renderList = (items: ReturnType<typeof row>[]) =>
    render(
      <InventoryList
        inventoryItems={items}
        equipment={{ head: null, body: null, mainHand: null, offHand: null }}
        onEquip={vi.fn()}
        onUseConsumable={vi.fn()}
        isUpdating={false}
      />,
    );

  it('o elmo diz que não dá CA e mostra o que resiste, antes de equipar', () => {
    renderList([row('h', 'chapeu_couro', 'Chapéu de Couro Fervido')]);
    expect(screen.getByText('Não dá CA')).toBeTruthy();
    expect(screen.getByText('Resiste: Cego')).toBeTruthy();
    expect(screen.queryByText(/^CA /)).toBeNull();
  });

  it('o botão Equipar do elmo avisa na dica que ele não dá CA e a que resiste', () => {
    renderList([row('h', 'elmo_bronze', 'Elmo de Bronze Fechado')]);
    const equip = screen.getByRole('button', { name: 'Equipar' });
    expect(equip.getAttribute('title')).toBe('Não dá CA · Resiste: Atordoado, Cego');
  });

  it('a armadura mostra a própria CA no inventário', () => {
    renderList([row('b', 'couro_cru', 'Couro Cru')]);
    expect(screen.getByText('CA 11 + DES')).toBeTruthy();
  });
});
