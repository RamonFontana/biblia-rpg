// A faixa de iniciativa do Palco: quem age agora e quem vem depois. Termos: CONTEXT.md (Palco).
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MotionConfig } from 'motion/react';

import { InitiativeStrip, type InitiativeEntry } from './InitiativeStrip';

const entry = (id: string, name: string, over: Partial<InitiativeEntry> = {}): InitiativeEntry => ({
  id,
  name,
  isMe: false,
  down: false,
  ...over,
});

const show = (entries: InitiativeEntry[], currentId: string | undefined, round = 1) =>
  render(
    <MotionConfig reducedMotion="always">
      <InitiativeStrip entries={entries} currentId={currentId} round={round} />
    </MotionConfig>,
  );

afterEach(cleanup);

const GUARD = entry('g', 'Guarda');
const ELIABE = entry('e', 'Eliabe', { isMe: true });
const RUTE = entry('r', 'Rute');

describe('InitiativeStrip', () => {
  it('lista quem age agora primeiro e marca o turno atual', () => {
    show([GUARD, ELIABE, RUTE], 'e');
    const items = within(screen.getByRole('list', { name: 'Ordem de iniciativa' })).getAllByRole(
      'listitem',
    );
    expect(items.map((i) => i.textContent)).toEqual([
      expect.stringContaining('Eliabe'),
      expect.stringContaining('Rute'),
      expect.stringContaining('Guarda'),
    ]);
    expect(items[0]).toHaveAttribute('aria-current', 'true');
    expect(items[1]).not.toHaveAttribute('aria-current');
  });

  it('diz a rodada', () => {
    show([GUARD, ELIABE], 'g', 3);
    expect(screen.getByText('Rodada 3')).toBeInTheDocument();
  });

  it('marca quem é o jogador e quem está caído', () => {
    show([GUARD, entry('e', 'Eliabe', { isMe: true, down: true })], 'g');
    expect(screen.getByText('Eliabe (você)')).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: /Eliabe.*caído/ })).toBeInTheDocument();
  });

  it('sem turno definido, mantém a ordem dada', () => {
    show([GUARD, ELIABE], undefined);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Guarda');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });
});
