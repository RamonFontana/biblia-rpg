import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SessionMap } from '@/data-access/maps';
import { MapaDoPalco } from './MapaDoPalco';

const map: SessionMap = {
  id: 'm1',
  session_id: 's1',
  library_id: 'terreno-areia',
  name: 'Deserto de Zim',
  columns: 20,
  rows: 15,
  grid_visible: true,
  ambient: null,
  position: 0,
  created_at: '2026-11-01T00:00:00Z',
};

describe('MapaDoPalco', () => {
  it('anuncia o nome do Mapa atual', () => {
    render(<MapaDoPalco map={map} />);
    expect(screen.getByRole('region', { name: 'Mapa: Deserto de Zim' })).toBeInTheDocument();
  });

  it('desenha o grid com uma linha por divisão de Quadrado', () => {
    render(<MapaDoPalco map={map} />);
    const grid = screen.getByTestId('grid-do-mapa');
    // 19 divisões internas em 20 colunas e 14 em 15 linhas.
    expect(grid.getAttribute('data-vertical')).toBe('19');
    expect(grid.getAttribute('data-horizontal')).toBe('14');
  });

  it('esconde as linhas quando o Mestre as desliga, sem perder o mapa', () => {
    render(<MapaDoPalco map={{ ...map, grid_visible: false }} />);
    expect(screen.queryByTestId('grid-do-mapa')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Mapa: Deserto de Zim' })).toBeInTheDocument();
  });

  it('avisa quando o mapa da Biblioteca não existe mais', () => {
    render(<MapaDoPalco map={{ ...map, library_id: 'terreno-sumiu' }} />);
    expect(screen.getByText('Mapa indisponível.')).toBeInTheDocument();
  });
});
