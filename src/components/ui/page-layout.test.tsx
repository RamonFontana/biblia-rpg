// PageShell, Panel e PageHeader: a moldura de página de docs/DESIGN.md. Os testes fixam a receita
// (mobile primeiro: tela cheia sem borda, moldura a partir de `sm`) e que as classes de quem usa
// vencem as da receita.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { PageHeader } from './page-header';
import { PageShell } from './page-shell';
import { Panel } from './panel';

afterEach(cleanup);

describe('PageShell', () => {
  it('é o fundo de pedra da página, sem folga no celular', () => {
    const { container } = render(<PageShell>conteúdo</PageShell>);
    const shell = container.firstElementChild as HTMLElement;
    expect(shell.className).toBe('min-h-screen bg-stone-900 text-stone-100 p-0 sm:p-4 md:p-8');
    expect(shell.textContent).toBe('conteúdo');
  });

  it('uma classe de quem usa substitui a da receita', () => {
    const { container } = render(<PageShell className="bg-stone-950 p-2" />);
    const { className } = container.firstElementChild as HTMLElement;
    expect(className).toContain('bg-stone-950');
    expect(className).not.toContain('bg-stone-900');
    expect(className).toContain('p-2');
    expect(className).not.toContain('p-0');
  });

  it('repassa atributos e a ref ao elemento', () => {
    let node: HTMLDivElement | null = null;
    render(
      <PageShell
        data-testid="shell"
        ref={(el) => {
          node = el;
        }}
      />,
    );
    expect(screen.getByTestId('shell')).toBe(node);
  });
});

describe('Panel', () => {
  it('ocupa a tela no celular e ganha moldura a partir de sm', () => {
    const { container } = render(<Panel>dentro</Panel>);
    const panel = container.firstElementChild as HTMLElement;
    expect(panel.className).toBe(
      'max-w-4xl mx-auto bg-stone-800 p-4 sm:p-6 rounded-none sm:rounded-xl shadow-none sm:shadow-lg border-0 sm:border border-stone-700 min-h-screen sm:min-h-0',
    );
    expect(panel.textContent).toBe('dentro');
  });

  it('uma largura própria substitui o max-w-4xl', () => {
    const { container } = render(<Panel className="max-w-6xl" />);
    const { className } = container.firstElementChild as HTMLElement;
    expect(className).toContain('max-w-6xl');
    expect(className).not.toContain('max-w-4xl');
    expect(className).toContain('bg-stone-800');
  });
});

describe('PageHeader', () => {
  it('desenha o título como h1 em serifa âmbar', () => {
    render(<PageHeader title="Criação de Personagem" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('Criação de Personagem');
    expect(heading.className).toBe('text-3xl font-serif text-amber-500');
  });

  it('o cabeçalho leva a divisória de pedra', () => {
    const { container } = render(<PageHeader title="T" />);
    expect((container.firstElementChild as HTMLElement).tagName).toBe('HEADER');
    expect((container.firstElementChild as HTMLElement).className).toBe(
      'mb-8 border-b border-stone-700 pb-4',
    );
  });

  it('uma classe de quem usa substitui a da receita', () => {
    const { container } = render(<PageHeader title="T" className="mb-2" />);
    const { className } = container.firstElementChild as HTMLElement;
    expect(className).toContain('mb-2');
    expect(className).not.toContain('mb-8');
    expect(className).toContain('border-stone-700');
  });

  it('a linha de apoio só aparece quando há subtítulo', () => {
    const { container, rerender } = render(<PageHeader title="T" />);
    expect(container.querySelector('p')).toBeNull();
    rerender(<PageHeader title="T" subtitle="Passo 3 de 9" />);
    const line = screen.getByText('Passo 3 de 9');
    expect(line.tagName).toBe('P');
    expect(line.className).toBe('text-stone-400 mt-2');
  });

  it('os filhos vêm depois do título e do subtítulo', () => {
    const { container } = render(
      <PageHeader title="T" subtitle="S">
        <div data-testid="extra" />
      </PageHeader>,
    );
    const tags = Array.from(container.firstElementChild!.children).map(
      (el) => el.tagName + (el.getAttribute('data-testid') ?? ''),
    );
    expect(tags).toEqual(['H1', 'P', 'DIVextra']);
  });
});
