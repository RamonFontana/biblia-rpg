// Onde cada item do inventário se equipa. Os itens vêm do banco com `effects` vazio (como em
// produção), então o lugar tem de sair do catálogo pelo slug. Antes, o escudo vinha do catálogo
// como "offHand", que o inventário não entende, e nenhum escudo podia ser equipado.
// Decisões: ROADMAP.md, Onda 3 (passo 5). Termos: CONTEXT.md (CA).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { InventoryList } from './InventoryList';

afterEach(cleanup);

const row = (slug: string, name: string, category: string) => ({
  id: `ci-${slug}`,
  item_id: `item-${slug}`,
  quantity: 1,
  level: 1,
  items: { slug, name, category, effects: {}, description: '' },
});

function renderList(item: ReturnType<typeof row>) {
  const onEquip = vi.fn();
  render(
    <InventoryList
      inventoryItems={[item]}
      equipment={{ head: null, body: null, mainHand: null, offHand: null }}
      onEquip={onEquip}
      onUseConsumable={vi.fn()}
      isUpdating={false}
    />,
  );
  return onEquip;
}

describe('InventoryList: o botão de equipar sai do catálogo', () => {
  it.each([
    ['escudo', 'shield', 'Escudo (Madeira/Bronze)', 'Escudo'],
    ['chapeu_couro', 'head', 'Chapéu de Couro Fervido', 'Armadura'],
    ['elmo_bronze', 'head', 'Elmo de Bronze Fechado', 'Armadura'],
    ['couro_cru', 'body', 'Couro Cru', 'Armadura'],
    ['lorica', 'body', 'Lorica de Escamas Pesada', 'Armadura'],
    ['arco_curto', '2h', 'Arco Curto', 'Arma'],
  ])('%s se equipa no slot %s', (slug, slot, name, category) => {
    const onEquip = renderList(row(slug, name, category));
    fireEvent.click(screen.getByRole('button', { name: 'Equipar' }));
    expect(onEquip).toHaveBeenCalledWith(`ci-${slug}`, expect.objectContaining({ slot }));
  });

  it('arma de uma mão pede a mão', () => {
    renderList(row('espada_curta', 'Espada Curta (Ferro)', 'Arma'));
    expect(screen.getByRole('button', { name: 'Mão Principal' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mão Secundária' })).toBeTruthy();
  });

  it('corda e outros itens que não se equipam não têm botão', () => {
    renderList(row('corda', 'Corda de Cânhamo (15m)', 'Utilidade'));
    expect(screen.queryByRole('button', { name: 'Equipar' })).toBeNull();
  });
});
