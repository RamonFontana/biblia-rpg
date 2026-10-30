// A lista de iniciativa do Palco do Mestre no celular: uma linha por participante, que expande para
// o dano, as Condições e os controles. Termos: CONTEXT.md (Palco).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { InitiativeList, type InitiativeRow } from './InitiativeList';

const row = (id: string, name: string, over: Partial<InitiativeRow> = {}): InitiativeRow => ({
  id,
  name,
  kind: 'player',
  initiative: 10,
  pv: 12,
  down: false,
  ...over,
});

const onToggle = vi.fn();
const show = (rows: InitiativeRow[], expandedId?: string, currentId?: string) =>
  render(
    <InitiativeList
      rows={rows}
      round={2}
      currentId={currentId}
      expandedId={expandedId}
      onToggle={onToggle}
      renderExpanded={(id) => <p>Controles de {id}</p>}
    />,
  );

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('InitiativeList', () => {
  it('lista os participantes na ordem recebida, com a rodada', () => {
    show([row('a', 'Guarda', { kind: 'enemy', initiative: 15 }), row('b', 'Eliabe')]);
    expect(screen.getByRole('list', { name: 'Ordem de iniciativa' })).toBeInTheDocument();
    expect(screen.getByText('Rodada 2')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveAccessibleName('Guarda, iniciativa 15, 12 PV');
    expect(buttons[1]).toHaveAccessibleName('Eliabe, iniciativa 10, 12 PV');
  });

  it('marca o turno atual e quem está caído no nome acessível', () => {
    show([row('a', 'Guarda'), row('b', 'Eliabe', { pv: 0, down: true })], undefined, 'a');
    expect(screen.getByRole('button', { name: /^Guarda,.*turno atual$/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('button', { name: /^Eliabe,.*caído$/ })).toBeInTheDocument();
  });

  it('só a linha expandida mostra os controles', () => {
    show([row('a', 'Guarda'), row('b', 'Eliabe')], 'b');
    expect(screen.getByRole('button', { name: /^Eliabe/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: /^Guarda/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByText('Controles de b')).toBeInTheDocument();
    expect(screen.queryByText('Controles de a')).toBeNull();
  });

  it('tocar na linha avisa qual', () => {
    show([row('a', 'Guarda')]);
    fireEvent.click(screen.getByRole('button', { name: /^Guarda/ }));
    expect(onToggle).toHaveBeenCalledWith('a');
  });
});
