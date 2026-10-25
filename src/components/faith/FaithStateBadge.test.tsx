// O selo do Estado de Fé: o nome do estado sempre em texto (a cor só reforça), a dica com o efeito
// do doc e, para o Mestre no Vulnerável, o lembrete do Testemunho. Segue a Fé Atual.
// Termos: CONTEXT.md (Estado de Fé, Testemunho). Regras: docs/regras-base.md, 4.2.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { FaithStateBadge } from './FaithStateBadge';

afterEach(cleanup);

describe('FaithStateBadge', () => {
  it.each([
    [80, 'Inabalável', 'text-green-400'],
    [50, 'Comum', 'text-stone-300'],
    [20, 'Abalado', 'text-amber-400'],
    [5, 'Vulnerável', 'text-red-400'],
    [0, 'Ruptura', 'text-red-400'],
  ])('com Fé %i mostra "%s" em texto, na cor da paleta', (faith, label, color) => {
    render(<FaithStateBadge stats={{ current_faith: faith }} />);
    const badge = screen.getByText(label);
    expect(badge.className).toContain(color);
  });

  it('a dica traz o efeito do doc', () => {
    render(<FaithStateBadge stats={{ current_faith: 20 }} />);
    expect(screen.getByText('Abalado').getAttribute('title')).toContain('Desvantagem');
  });

  it('o Mestre no Vulnerável ganha o lembrete de pedir Testemunho; o jogador não', () => {
    const { rerender } = render(<FaithStateBadge stats={{ current_faith: 5 }} viewerIsGM />);
    expect(screen.getByText('Vulnerável').getAttribute('title')).toContain('Peça um Testemunho');
    rerender(<FaithStateBadge stats={{ current_faith: 5 }} />);
    expect(screen.getByText('Vulnerável').getAttribute('title')).not.toContain('Peça um');
  });

  it('o lembrete do Testemunho é só do Vulnerável', () => {
    render(<FaithStateBadge stats={{ current_faith: 20 }} viewerIsGM />);
    expect(screen.getByText('Abalado').getAttribute('title')).not.toContain('Peça um');
  });
});
