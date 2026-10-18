// O cartão da lista mostra a CA calculada (atributos + equipamento), não o stats.ca gravado na
// criação. Decisões: ROADMAP.md, Onda 3 (passo 5). Termos: CONTEXT.md (CA).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { CharacterCard } from './CharacterCard';
import type { Character } from '../types';

afterEach(cleanup);

const character = (over: Record<string, unknown> = {}) =>
  ({
    id: 'c1',
    name: 'Eli',
    tribe: 'Judá',
    vocation: 'Guerreiro',
    level: 1,
    attributes: { for: 10, des: 14, con: 10, int: 10, sab: 10, car: 10 },
    stats: { pv: 10, ca: 99, faith: 50 },
    equipment: null,
    character_items: [],
    ...over,
  }) as unknown as Character;

const caShown = () => screen.getByText('CA').nextElementSibling?.textContent;

describe('CharacterCard: CA', () => {
  it('sem equipamento é 10 + DES, não o stats.ca gravado', () => {
    render(<CharacterCard character={character()} onClick={vi.fn()} />);
    expect(caShown()).toBe('12');
  });

  it('soma a armadura equipada', () => {
    const c = character({
      equipment: { body: 'ci1' },
      character_items: [{ id: 'ci1', level: 1, items: { slug: 'couro_cru' } }],
    });
    render(<CharacterCard character={c} onClick={vi.fn()} />);
    expect(caShown()).toBe('13');
  });
});
