// CARACTERIZAÇÃO: fixa a moldura da criação de personagem (a tela de referência de docs/DESIGN.md):
// o passo mostrado, o título de criar ou editar, o progresso e os chips de navegação da edição.
// Os passos são stubs. Decisões: ROADMAP.md, Onda 4, passo 6.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('./steps/TribeSelection', async () => ({
  TribeSelection: (await import('@/test/stubs')).makeStub('TribeSelection'),
}));
vi.mock('./steps/VocationSelection', async () => ({
  VocationSelection: (await import('@/test/stubs')).makeStub('VocationSelection'),
}));
vi.mock('./steps/AttributeGeneration', async () => ({
  AttributeGeneration: (await import('@/test/stubs')).makeStub('AttributeGeneration'),
}));
vi.mock('./steps/SkillsStep', async () => ({
  SkillsStep: (await import('@/test/stubs')).makeStub('SkillsStep'),
}));
vi.mock('./steps/FaithAspects', async () => ({
  FaithAspects: (await import('@/test/stubs')).makeStub('FaithAspects'),
}));
vi.mock('./steps/InitialStats', async () => ({
  InitialStats: (await import('@/test/stubs')).makeStub('InitialStats'),
}));
vi.mock('./steps/EquipmentMerchant', async () => ({
  EquipmentMerchant: (await import('@/test/stubs')).makeStub('EquipmentMerchant'),
}));
vi.mock('./steps/NarrativeDetails', async () => ({
  NarrativeDetails: (await import('@/test/stubs')).makeStub('NarrativeDetails'),
}));
vi.mock('./steps/Summary', async () => ({
  Summary: (await import('@/test/stubs')).makeStub('Summary'),
}));

import { clearStubs } from '@/test/stubs';
import { useCharacterCreationStore } from '../store/useCharacterCreationStore';
import { WizardLayout } from './WizardLayout';

const STEPS = [
  'TribeSelection',
  'VocationSelection',
  'AttributeGeneration',
  'SkillsStep',
  'FaithAspects',
  'InitialStats',
  'EquipmentMerchant',
  'NarrativeDetails',
  'Summary',
];
const LABELS = [
  'Tribo',
  'Vocação',
  'Atributos',
  'Perícias',
  'Fé',
  'Status',
  'Equipamento',
  'Narrativa',
  'Resumo',
];

const start = (currentStep: number, editingId?: string) => {
  useCharacterCreationStore.setState({ currentStep, editingId });
  return render(<WizardLayout />);
};
const shownStep = (container: HTMLElement) =>
  container.querySelector('[data-stub]')?.getAttribute('data-stub');
const progressWidth = (container: HTMLElement) =>
  (container.querySelector('.bg-amber-500.h-full') as HTMLElement).style.width;

beforeEach(() => {
  clearStubs();
});
afterEach(() => {
  cleanup();
  useCharacterCreationStore.getState().reset();
});

describe('WizardLayout: o passo mostrado', () => {
  it.each(STEPS.map((name, index) => [index + 1, name] as const))(
    'o passo %i desenha %s',
    (step, name) => {
      const { container } = start(step);
      expect(shownStep(container)).toBe(name);
      expect(container.querySelectorAll('[data-stub]')).toHaveLength(1);
    },
  );

  it('um passo fora de 1–9 mostra "Passo Desconhecido"', () => {
    const { container } = start(10);
    expect(shownStep(container)).toBeUndefined();
    expect(screen.getByText('Passo Desconhecido')).toBeTruthy();
  });

  it('os filhos passados ocupam o lugar do passo', () => {
    useCharacterCreationStore.setState({ currentStep: 1, editingId: undefined });
    const { container } = render(
      <WizardLayout>
        <p>conteúdo próprio</p>
      </WizardLayout>,
    );
    expect(screen.getByText('conteúdo próprio')).toBeTruthy();
    expect(shownStep(container)).toBeUndefined();
  });
});

describe('WizardLayout: cabeçalho e progresso', () => {
  it('criar: título "Criação de Personagem" e "Passo N de 9"', () => {
    start(3);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Criação de Personagem');
    expect(screen.getByText('Passo 3 de 9')).toBeTruthy();
  });

  it('editar: título "Edição de Personagem"', () => {
    start(3, 'char-1');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Edição de Personagem');
  });

  it.each([
    [1, 100 / 9],
    [5, 500 / 9],
    [9, 100],
  ])('no passo %i o preenchimento tem a largura proporcional', (step, percent) => {
    const { container } = start(step);
    expect(parseFloat(progressWidth(container))).toBeCloseTo(percent, 6);
  });
});

describe('WizardLayout: chips de navegação (só na edição)', () => {
  it('ao criar, não há chips', () => {
    start(2);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('ao editar, há um chip por passo, na ordem', () => {
    start(2, 'char-1');
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(LABELS);
  });

  it('só o chip do passo atual tem o destaque âmbar', () => {
    start(4, 'char-1');
    const active = screen
      .getAllByRole('button')
      .filter((b) => b.className.includes('bg-amber-600'));
    expect(active.map((b) => b.textContent)).toEqual(['Perícias']);
    expect(active[0].className).toContain('font-bold');
  });

  it('clicar num chip leva ao passo dele', () => {
    const { container } = start(1, 'char-1');
    fireEvent.click(screen.getByRole('button', { name: 'Equipamento' }));
    expect(useCharacterCreationStore.getState().currentStep).toBe(7);
    expect(shownStep(container)).toBe('EquipmentMerchant');
  });
});

describe('WizardLayout: moldura', () => {
  it('o painel é de tela cheia no celular e ganha moldura a partir de sm', () => {
    const { container } = start(1);
    const shell = container.firstElementChild as HTMLElement;
    const panel = shell.firstElementChild as HTMLElement;
    expect(shell.className).toBe('min-h-screen bg-stone-900 text-stone-100 p-0 sm:p-4 md:p-8');
    expect(panel.className).toBe(
      'max-w-4xl mx-auto bg-stone-800 p-4 sm:p-6 rounded-none sm:rounded-xl shadow-none sm:shadow-lg border-0 sm:border border-stone-700 min-h-screen sm:min-h-0',
    );
  });
});
