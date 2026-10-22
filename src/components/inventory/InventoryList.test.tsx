// Onde cada item do inventário se equipa. Os itens vêm do banco com `effects` vazio (como em
// produção), então o lugar tem de sair do catálogo pelo slug. Antes, o escudo vinha do catálogo
// como "offHand", que o inventário não entende, e nenhum escudo podia ser equipado.
// Decisões: ROADMAP.md, Onda 3 (passo 5). Termos: CONTEXT.md (CA).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { InventoryItem } from '@/types/inventory';
import { InventoryList } from './InventoryList';

afterEach(cleanup);

const row = (slug: string, name: string, category: string) => ({
  id: `ci-${slug}`,
  item_id: `item-${slug}`,
  quantity: 1,
  level: 1,
  items: { slug, name, category, effects: {}, description: '' },
});

function renderList(item: InventoryItem, character: { vocation?: string; strength?: number } = {}) {
  const onEquip = vi.fn();
  render(
    <InventoryList
      inventoryItems={[item]}
      vocation={character.vocation}
      strength={character.strength}
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

describe('InventoryList: avisos ao equipar armadura e escudo', () => {
  const cota = () => row('cota_escamas', 'Cota de Escamas de Bronze', 'Armadura');
  const lorica = () => row('lorica', 'Lorica de Escamas Pesada', 'Armadura');

  it('sem proficiência avisa, mas deixa equipar', () => {
    const onEquip = renderList(cota(), { vocation: 'Batedor', strength: 10 });
    expect(screen.getByText('Sem proficiência em armadura média')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Equipar' }));
    expect(onEquip).toHaveBeenCalledOnce();
  });

  it('sem a FOR exigida avisa quanto falta', () => {
    renderList(lorica(), { vocation: 'Guerreiro', strength: 10 });
    expect(screen.getByText('Requer FOR 13 (você tem 10)')).toBeTruthy();
    expect(screen.queryByText(/Sem proficiência/)).toBeNull();
  });

  it('quem tem a proficiência e a FOR não vê aviso', () => {
    renderList(lorica(), { vocation: 'Guerreiro', strength: 14 });
    expect(screen.queryByText(/Requer FOR/)).toBeNull();
    expect(screen.queryByText(/Sem proficiência/)).toBeNull();
  });

  it('sem Vocação na ficha não há aviso', () => {
    renderList(lorica());
    expect(screen.queryByText(/Requer FOR/)).toBeNull();
    expect(screen.queryByText(/Sem proficiência/)).toBeNull();
  });

  it('escudo e Túnica Sagrada avisam quem não pode usar', () => {
    renderList(row('escudo', 'Escudo (Madeira/Bronze)', 'Escudo'), { vocation: 'Batedor' });
    expect(screen.getByText('Sem proficiência em escudo')).toBeTruthy();
    cleanup();
    renderList(row('tunica_sagrada', 'Túnica Sagrada (Levita)', 'Armadura'), {
      vocation: 'Guerreiro',
    });
    expect(screen.getByText('Armadura exclusiva de Sacerdote e Sábio')).toBeTruthy();
  });

  it('armas não recebem aviso de armadura', () => {
    renderList(row('espada_curta', 'Espada Curta (Ferro)', 'Arma'), { vocation: 'Sacerdote' });
    expect(screen.queryByText(/Sem proficiência/)).toBeNull();
  });
});

describe('InventoryList: Resistência a Condição do item × personalizada', () => {
  // As duas aparecem como "Resiste: …"; a personalizada é a que o Mestre acrescentou ao item.
  const elmoComExtra = () => ({
    ...row('elmo_bronze', 'Elmo de Bronze Fechado', 'Armadura'),
    custom_condition_resistances: ['Pestilência'],
  });

  it('a resistência que o item já dá não leva a nota de personalizada', () => {
    const item = elmoComExtra();
    renderList(item);
    const proprias = screen
      .getAllByText(/^Resiste: /)
      .filter((el) => el.textContent !== 'Resiste: Pestilência');
    expect(proprias.length).toBeGreaterThan(0);
    for (const el of proprias) expect(el.getAttribute('title')).toBeNull();
  });

  it('a resistência personalizada diz, em texto, que é personalizada', () => {
    const item = elmoComExtra();
    renderList(item);
    expect(screen.getByText('Resiste: Pestilência').getAttribute('title')).toBe(
      'Resistência personalizada',
    );
  });
});

describe('InventoryList: peso e consumível', () => {
  const withItems = (
    items: Partial<InventoryItem['items']>,
    over: Partial<InventoryItem> = {},
  ): InventoryItem => {
    const base = row('corda', 'Corda', 'Utilidade');
    return { ...base, ...over, items: { ...base.items, ...items } };
  };

  it('mostra o peso do item quando ele é maior que zero', () => {
    renderList(withItems({ weight: 2 }));
    expect(screen.getByText('2 kg')).toBeInTheDocument();
  });

  it.each([[0], [null], [undefined]])('sem peso (%s) não mostra a linha de peso', (weight) => {
    renderList(withItems({ weight }));
    expect(screen.queryByText(/kg/)).toBeNull();
  });

  it('o consumível entrega a linha com os efeitos já normalizados', () => {
    const onUseConsumable = vi.fn();
    const item = withItems({
      is_consumable: true,
      effects: { heal: 4 },
      description: 'Cura 4 PV',
    });
    render(
      <InventoryList
        inventoryItems={[item]}
        equipment={null}
        onEquip={vi.fn()}
        onUseConsumable={onUseConsumable}
        isUpdating={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Usar' }));
    expect(onUseConsumable).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ci-corda',
        quantity: 1,
        items: expect.objectContaining({
          name: 'Corda',
          effects: expect.objectContaining({ heal: 4 }),
        }),
      }),
    );
  });

  it('o consumível sem unidades não pode ser usado', () => {
    renderList(withItems({ is_consumable: true }, { quantity: 0 }));
    expect(screen.getByRole('button', { name: 'Usar' })).toBeDisabled();
  });
});
