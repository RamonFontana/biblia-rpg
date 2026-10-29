// DockPanel: o Painel da tela da sessão (ADR 0009). Um diálogo com nome, que fecha pelo botão e
// pelo Esc; trocar o conteúdo não fecha. Termos: CONTEXT.md (Painel).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { DockPanel } from './dock-panel';

afterEach(cleanup);

describe('DockPanel', () => {
  it('aberto, é um diálogo com o título como nome', () => {
    render(
      <DockPanel open title="Ficha" onOpenChange={() => {}}>
        <p>conteúdo da ficha</p>
      </DockPanel>,
    );
    expect(screen.getByRole('dialog', { name: 'Ficha' })).toBeInTheDocument();
    expect(screen.getByText('conteúdo da ficha')).toBeInTheDocument();
  });

  it('fechado, não desenha nada', () => {
    render(
      <DockPanel open={false} title="Ficha" onOpenChange={() => {}}>
        <p>conteúdo da ficha</p>
      </DockPanel>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('conteúdo da ficha')).not.toBeInTheDocument();
  });

  it('o botão Fechar e o Esc pedem para fechar', () => {
    const onOpenChange = vi.fn();
    render(
      <DockPanel open title="Grupo" onOpenChange={onOpenChange}>
        <p>grupo</p>
      </DockPanel>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    onOpenChange.mockClear();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('trocar de Painel troca o título e o conteúdo sem fechar', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <DockPanel open title="Ficha" onOpenChange={onOpenChange}>
        <p>ficha</p>
      </DockPanel>,
    );
    rerender(
      <DockPanel open title="Histórico" onOpenChange={onOpenChange}>
        <p>histórico</p>
      </DockPanel>,
    );
    expect(screen.getByRole('dialog', { name: 'Histórico' })).toBeInTheDocument();
    expect(screen.getByText('histórico')).toBeInTheDocument();
    expect(screen.queryByText('ficha')).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
