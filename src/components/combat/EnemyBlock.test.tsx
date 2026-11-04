import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EnemyBlock } from './EnemyBlock';

afterEach(cleanup);

const lion = {
  narrative: {
    enemy: {
      presetId: 'enemy-preset-leao-da-judeia',
      attacks: [
        {
          name: 'Mordida',
          mode: 'melee',
          attribute: 'for',
          hitBonus: 5,
          reach: '1,5m',
          damage: { dice: '1d8', bonus: 3 },
          damageType: 'perfurante',
        },
      ],
      details: { speed: '15 m', senses: 'Percepção passiva 13', challenge: '1 (200 XP)' },
    },
  },
};

describe('EnemyBlock', () => {
  it('mostra ataques e detalhes do inimigo de Preset', () => {
    render(<EnemyBlock character={lion} />);
    expect(screen.getByRole('region', { name: 'Bloco' })).toBeInTheDocument();
    expect(screen.getByText('Mordida')).toBeInTheDocument();
    expect(screen.getByText(/\+5 para acertar · 1,5m · 1d8\+3 perfurante/)).toBeInTheDocument();
    expect(screen.getByText('15 m')).toBeInTheDocument();
    expect(screen.getByText('1 (200 XP)')).toBeInTheDocument();
    expect(screen.queryByText('Perícias:')).not.toBeInTheDocument();
  });

  it('inimigo sem bloco não mostra seção vazia', () => {
    const { container } = render(<EnemyBlock character={{ narrative: { imageUrl: '' } }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
