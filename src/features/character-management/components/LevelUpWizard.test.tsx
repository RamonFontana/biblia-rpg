// CARACTERIZAÇÃO: fixa os passos do level-up, as escolhas (caminho de Tribo e de Vocação, Aumento de
// Atributo) e o que vai para `updateCharacter`. As Habilidades são falsas para o teste não depender
// do conteúdo do jogo. Decisões: ROADMAP.md, Onda 4, passo 7c. Termos: CONTEXT.md (Marco, Caminho).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({ updateCharacter: vi.fn() }));

vi.mock('@/data-access/characters', () => ({ updateCharacter: h.updateCharacter }));
vi.mock('@/content/abilities', () => {
  const base = { actionType: 'passive', usageType: 'unlimited' };
  return {
    ABILITIES: [
      {
        ...base,
        id: 'tribe-aser-a',
        name: 'Calçado de Ferro',
        sourceType: 'tribe',
        sourceId: 'aser',
        minLevel: 4,
        path: 'A',
        effect: 'Efeito do Calçado',
      },
      {
        ...base,
        id: 'tribe-aser-b',
        name: 'Delícias Reais',
        sourceType: 'tribe',
        sourceId: 'aser',
        minLevel: 4,
        path: 'B',
        effect: 'Efeito das Delícias',
      },
      {
        ...base,
        id: 'tribe-aser-x',
        name: 'Sem Caminho',
        sourceType: 'tribe',
        sourceId: 'aser',
        minLevel: 4,
        effect: 'Sem caminho',
      },
      {
        ...base,
        id: 'tribe-aser-l5',
        name: 'Nível Cinco',
        sourceType: 'tribe',
        sourceId: 'aser',
        minLevel: 5,
        path: 'A',
        effect: 'Nível 5',
      },
      {
        ...base,
        id: 'tribe-da-a',
        name: 'Ataque Ofuscante',
        sourceType: 'tribe',
        sourceId: 'da',
        minLevel: 4,
        path: 'A',
        effect: 'Efeito do Ataque',
      },
      {
        ...base,
        id: 'vocation-guerreiro-a',
        name: 'Golpe Firme',
        sourceType: 'vocation',
        sourceId: 'guerreiro',
        minLevel: 4,
        path: 'A',
        effect: 'Efeito do Golpe',
      },
      {
        ...base,
        id: 'vocation-guerreiro-b',
        name: 'Muro de Escudos',
        sourceType: 'vocation',
        sourceId: 'guerreiro',
        minLevel: 4,
        path: 'B',
        effect: 'Efeito do Muro',
      },
      {
        ...base,
        id: 'vocation-cacador-a',
        name: 'Rastro Antigo',
        sourceType: 'vocation',
        sourceId: 'cacador',
        minLevel: 4,
        path: 'A',
        effect: 'Efeito do Rastro',
      },
    ],
  };
});

import type { Character } from '../types';
import { LevelUpWizard } from './LevelUpWizard';

const onComplete = vi.fn();
const onCancel = vi.fn();

const character = (over: Partial<Character> = {}): Character => ({
  id: 'c1',
  user_id: 'u1',
  name: 'Eliab',
  tribe: 'Aser',
  vocation: 'Guerreiro',
  level: 1,
  attributes: { for: 14, des: 12, con: 12, int: 10, sab: 10, car: 8 },
  stats: { pv: 10, current_pv: 8, ca: 12, faith: 50, current_faith: 40 },
  skills: {},
  has_participated_in_session: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
});

const renderWizard = (over: Partial<Character> = {}) =>
  render(<LevelUpWizard character={character(over)} onComplete={onComplete} onCancel={onCancel} />);

const next = () => fireEvent.click(screen.getByRole('button', { name: 'Próximo Passo' }));
const finish = () => fireEvent.click(screen.getByRole('button', { name: 'Finalizar Progressão' }));
const pick = (attr1: string, attr2: string) => {
  const [slot1, slot2] = screen.getAllByRole('combobox');
  fireEvent.change(slot1, { target: { value: attr1 } });
  fireEvent.change(slot2, { target: { value: attr2 } });
};

beforeEach(() => {
  h.updateCharacter.mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('LevelUpWizard: nível sem escolhas', () => {
  it('mostra só o passo de PV e o resumo', () => {
    renderWizard();
    expect(screen.getByText('Passo 1 de 2')).toBeInTheDocument();
    expect(screen.getByText(/Subindo para nível 2/)).toBeInTheDocument();
  });

  it('mostra no passo de PV a média da Vocação, o modificador de CON e o total', () => {
    renderWizard();
    expect(screen.getByText('Vocação (Guerreiro)')).toBeInTheDocument();
    expect(screen.getByText('+6 PV')).toBeInTheDocument();
    expect(screen.getByText('+1 PV')).toBeInTheDocument();
    expect(screen.getByText('+7 PV')).toBeInTheDocument();
    expect(screen.queryByText('Retroativo')).toBeNull();
  });

  it('grava o nível, os PV e a progressão pendente desligada', async () => {
    renderWizard();
    next();
    expect(screen.getByText('Novo Nível').nextSibling).toHaveTextContent('2');
    expect(screen.getByText('PV Máximo Adicional').nextSibling).toHaveTextContent('+7');
    finish();

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(h.updateCharacter).toHaveBeenCalledTimes(1);
    expect(h.updateCharacter).toHaveBeenCalledWith('c1', {
      level: 2,
      pending_level_up: false,
      stats: { pv: 17, current_pv: 15, ca: 12, faith: 50, current_faith: 40, level: 2 },
      attributes: { for: 14, des: 12, con: 12, int: 10, sab: 10, car: 8 },
      skills: { path_choices: { tribe: {}, vocation: {} } },
    });
  });

  it('usa a média 5 para uma Vocação desconhecida e CON 10 sem atributos', async () => {
    renderWizard({ vocation: 'Nobre', attributes: undefined, stats: undefined, level: undefined });
    expect(screen.getByText('+5 PV', { selector: 'span.text-2xl' })).toBeInTheDocument();
    next();
    finish();

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(h.updateCharacter).toHaveBeenCalledWith('c1', {
      level: 2,
      pending_level_up: false,
      stats: { level: 2, pv: 5, current_pv: 5 },
      attributes: {},
      skills: { path_choices: { tribe: {}, vocation: {} } },
    });
  });

  it('lê o nível de stats.level quando a coluna level está vazia', () => {
    renderWizard({ level: undefined, stats: { pv: 10, ca: 12, faith: 50, level: 2 } as never });
    expect(screen.getByText(/Subindo para nível 3/)).toBeInTheDocument();
  });

  it('não exige escolha para avançar', () => {
    renderWizard();
    expect(screen.getByRole('button', { name: 'Próximo Passo' })).toBeEnabled();
  });
});

describe('LevelUpWizard: navegação', () => {
  it('Cancelar no primeiro passo chama onCancel', () => {
    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(h.updateCharacter).not.toHaveBeenCalled();
  });

  it('Voltar, a partir do segundo passo, volta um passo sem cancelar', () => {
    renderWizard();
    next();
    expect(screen.getByText('Passo 2 de 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(screen.getByText('Passo 1 de 2')).toBeInTheDocument();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('o último passo oferece Finalizar em vez de Próximo', () => {
    renderWizard();
    expect(screen.queryByRole('button', { name: 'Finalizar Progressão' })).toBeNull();
    next();
    expect(screen.queryByRole('button', { name: 'Próximo Passo' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Finalizar Progressão' })).toBeInTheDocument();
  });
});

describe('LevelUpWizard: nível com caminhos e aumento de atributo', () => {
  const level3 = (over: Partial<Character> = {}) => ({ level: 3, ...over });

  it('lista tribo, vocação, atributo, PV e resumo, nessa ordem', () => {
    renderWizard(level3());
    expect(screen.getByText('Passo 1 de 5')).toBeInTheDocument();
    expect(screen.getByText(/habilidade passiva ou ativa de Tribo/)).toBeInTheDocument();
    pickCard('Calçado de Ferro');
    next();
    expect(screen.getByText(/habilidade passiva ou ativa de Vocação/)).toBeInTheDocument();
    pickCard('Golpe Firme');
    next();
    expect(screen.getByText(/Você pode aumentar um atributo/)).toBeInTheDocument();
    pick('for', 'des');
    next();
    expect(screen.getByText('Total Ganho')).toBeInTheDocument();
    next();
    expect(screen.getByText('Resumo da Evolução')).toBeInTheDocument();
  });

  function pickCard(name: string) {
    fireEvent.click(screen.getByText(name));
  }

  it('só lista as Habilidades do nível novo, da Tribo e com Caminho', () => {
    renderWizard(level3());
    expect(screen.getByText('Calçado de Ferro')).toBeInTheDocument();
    expect(screen.getByText('Delícias Reais')).toBeInTheDocument();
    expect(screen.getByText('Efeito do Calçado')).toBeInTheDocument();
    expect(screen.getByText('Caminho A')).toBeInTheDocument();
    expect(screen.getByText('Caminho B')).toBeInTheDocument();
    expect(screen.queryByText('Sem Caminho')).toBeNull();
    expect(screen.queryByText('Nível Cinco')).toBeNull();
    expect(screen.queryByText('Ataque Ofuscante')).toBeNull();
  });

  it('casa a Tribo e a Vocação sem acento nem maiúscula', () => {
    renderWizard(level3({ tribe: 'Dã', vocation: 'Caçador' }));
    expect(screen.getByText('Ataque Ofuscante')).toBeInTheDocument();
    pickCard('Ataque Ofuscante');
    next();
    expect(screen.getByText('Rastro Antigo')).toBeInTheDocument();
  });

  it('exige o Caminho da Tribo e o da Vocação antes de avançar', () => {
    renderWizard(level3());
    expect(screen.getByRole('button', { name: 'Próximo Passo' })).toBeDisabled();
    pickCard('Delícias Reais');
    expect(screen.getByRole('button', { name: 'Próximo Passo' })).toBeEnabled();
    next();
    expect(screen.getByRole('button', { name: 'Próximo Passo' })).toBeDisabled();
    pickCard('Muro de Escudos');
    expect(screen.getByRole('button', { name: 'Próximo Passo' })).toBeEnabled();
  });

  it('exige os dois pontos do Aumento de Atributo', () => {
    renderWizard(level3());
    pickCard('Calçado de Ferro');
    next();
    pickCard('Golpe Firme');
    next();
    const [slot1, slot2] = screen.getAllByRole('combobox');
    expect(screen.getByRole('button', { name: 'Próximo Passo' })).toBeDisabled();
    fireEvent.change(slot1, { target: { value: 'for' } });
    expect(screen.getByRole('button', { name: 'Próximo Passo' })).toBeDisabled();
    fireEvent.change(slot2, { target: { value: 'des' } });
    expect(screen.getByRole('button', { name: 'Próximo Passo' })).toBeEnabled();
  });

  it('grava os Caminhos e os dois pontos de atributo', async () => {
    renderWizard(level3({ stats: { pv: 30, current_pv: 22, ca: 12, faith: 50 } }));
    pickCard('Delícias Reais');
    next();
    pickCard('Golpe Firme');
    next();
    pick('for', 'des');
    next();
    next();
    expect(screen.getByText('Habilidade de Tribo').nextSibling).toHaveTextContent('Delícias Reais');
    expect(screen.getByText('Habilidade de Vocação').nextSibling).toHaveTextContent('Golpe Firme');
    expect(screen.getByText('Melhoria de Atributos (ASI)').nextSibling).toHaveTextContent(
      '+1 for, +1 des',
    );
    finish();

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(h.updateCharacter).toHaveBeenCalledWith('c1', {
      level: 4,
      pending_level_up: false,
      stats: { pv: 37, current_pv: 29, ca: 12, faith: 50, level: 4 },
      attributes: { for: 15, des: 13, con: 12, int: 10, sab: 10, car: 8 },
      skills: { path_choices: { tribe: { 4: 'B' }, vocation: { 4: 'A' } } },
    });
  });

  it('dois pontos no mesmo atributo somam +2 e rendem PV retroativo se for CON', async () => {
    renderWizard(level3({ stats: { pv: 30, current_pv: 22, ca: 12, faith: 50 } }));
    pickCard('Calçado de Ferro');
    next();
    pickCard('Golpe Firme');
    next();
    pick('con', 'con');
    next();
    expect(screen.getByText('+6 PV')).toBeInTheDocument();
    expect(screen.getByText('+2 PV')).toBeInTheDocument();
    expect(screen.getByText('Retroativo')).toBeInTheDocument();
    expect(screen.getByText('+3 PV')).toBeInTheDocument();
    expect(screen.getByText('+11 PV')).toBeInTheDocument();
    expect(
      screen.getByText(/O aumento de Constituição também rende PV retroativo/),
    ).toBeInTheDocument();
    next();
    expect(screen.getByText('Melhoria de Atributos (ASI)').nextSibling).toHaveTextContent('+2 con');
    expect(screen.getByText(/Inclui \+3 PV retroativo/)).toBeInTheDocument();
    finish();

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(h.updateCharacter).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        stats: { pv: 41, current_pv: 33, ca: 12, faith: 50, level: 4 },
        attributes: { for: 14, des: 12, con: 14, int: 10, sab: 10, car: 8 },
      }),
    );
  });

  it('desabilita o atributo que passaria de 20', () => {
    renderWizard(level3({ attributes: { for: 20, des: 19, con: 12, int: 10, sab: 10, car: 8 } }));
    pickCard('Calçado de Ferro');
    next();
    pickCard('Golpe Firme');
    next();
    const [slot1, slot2] = screen.getAllByRole('combobox');
    const option = (slot: HTMLElement, label: RegExp) =>
      Array.from(slot.querySelectorAll('option')).find((o) => label.test(o.textContent || ''));

    expect(option(slot1, /Força/)).toBeDisabled();
    expect(option(slot1, /Destreza/)).toBeEnabled();
    expect(option(slot2, /Destreza/)).toBeEnabled();
    fireEvent.change(slot1, { target: { value: 'des' } });
    expect(option(slot2, /Destreza/)).toBeDisabled();
    expect(option(slot2, /Constituição/)).toBeEnabled();
  });

  it('mostra o valor atual do atributo, com 10 quando a ficha não o tem', () => {
    renderWizard(level3({ attributes: { for: 14 } as never }));
    pickCard('Calçado de Ferro');
    next();
    pickCard('Golpe Firme');
    next();
    const [slot1] = screen.getAllByRole('combobox');
    expect(slot1).toHaveTextContent('Força (Atual: 14)');
    expect(slot1).toHaveTextContent('Destreza (Atual: 10)');
  });

  it('soma 1 a partir de 10 quando a ficha não tem atributos', async () => {
    renderWizard(level3({ attributes: undefined }));
    pickCard('Calçado de Ferro');
    next();
    pickCard('Golpe Firme');
    next();
    pick('for', 'des');
    next();
    next();
    finish();

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(h.updateCharacter).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ attributes: { for: 11, des: 11 } }),
    );
  });

  it('acrescenta o Caminho novo aos já escolhidos e preserva o resto de skills', async () => {
    renderWizard(
      level3({
        skills: {
          ability_uses: { 'tribe-aser-a': 1 },
          path_choices: { tribe: { 1: 'A' }, vocation: { 1: 'B' } },
        },
      }),
    );
    pickCard('Delícias Reais');
    next();
    pickCard('Golpe Firme');
    next();
    pick('for', 'des');
    next();
    next();
    finish();

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(h.updateCharacter).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        skills: {
          ability_uses: { 'tribe-aser-a': 1 },
          path_choices: { tribe: { 1: 'A', 4: 'B' }, vocation: { 1: 'B', 4: 'A' } },
        },
      }),
    );
  });

  it('converte o Caminho gravado como texto (formato antigo) para o nível 1', async () => {
    renderWizard(level3({ skills: { path_choices: { tribe: 'A', vocation: 'B' } } }));
    pickCard('Delícias Reais');
    next();
    pickCard('Golpe Firme');
    next();
    pick('for', 'des');
    next();
    next();
    finish();

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(h.updateCharacter).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        skills: { path_choices: { tribe: { 1: 'A', 4: 'B' }, vocation: { 1: 'B', 4: 'A' } } },
      }),
    );
  });
});

// Decisão do autor (ROADMAP, passo 9c, Q14): o assistente grava cópias dos mapas de Caminho. Antes
// alterava no lugar os objetos da ficha carregada, então uma gravação que falhava deixava a tela
// com o Caminho novo já escolhido.
describe('LevelUpWizard: não altera a ficha carregada', () => {
  const pickCard = (name: string) => fireEvent.click(screen.getByText(name));

  const finishLevel4 = () => {
    pickCard('Delícias Reais');
    next();
    pickCard('Golpe Firme');
    next();
    pick('for', 'des');
    next();
    next();
    finish();
  };

  const loaded = (path_choices: unknown) =>
    character({
      level: 3,
      skills: { ability_uses: { 'tribe-aser-a': 1 }, path_choices },
    } as Partial<Character>);

  const open = (sheet: Character) =>
    render(<LevelUpWizard character={sheet} onComplete={onComplete} onCancel={onCancel} />);

  it('uma gravação que falha deixa os Caminhos da ficha como estavam', async () => {
    const sheet = loaded({ tribe: { 1: 'A' }, vocation: { 1: 'B' } });
    const before = structuredClone(sheet);
    h.updateCharacter.mockRejectedValueOnce(new Error('sem rede'));
    open(sheet);
    finishLevel4();

    expect(await screen.findByText('sem rede')).toBeInTheDocument();
    expect(sheet).toEqual(before);
  });

  it('uma gravação que dá certo também não altera a ficha carregada', async () => {
    const sheet = loaded({ tribe: { 1: 'A' }, vocation: { 1: 'B' } });
    const before = structuredClone(sheet);
    open(sheet);
    finishLevel4();

    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(sheet).toEqual(before);
  });

  it('o Caminho gravado como texto (formato antigo) continua texto na ficha carregada', async () => {
    const sheet = loaded({ tribe: 'A', vocation: 'B' });
    h.updateCharacter.mockRejectedValueOnce(new Error('sem rede'));
    open(sheet);
    finishLevel4();

    expect(await screen.findByText('sem rede')).toBeInTheDocument();
    expect(sheet.skills).toEqual({
      ability_uses: { 'tribe-aser-a': 1 },
      path_choices: { tribe: 'A', vocation: 'B' },
    });
  });

  it('tentar de novo depois da falha grava os mesmos Caminhos, sem acumular', async () => {
    const sheet = loaded({ tribe: { 1: 'A' }, vocation: { 1: 'B' } });
    h.updateCharacter.mockRejectedValueOnce(new Error('sem rede'));
    open(sheet);
    finishLevel4();
    await screen.findByText('sem rede');

    finish();
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    const [first, second] = h.updateCharacter.mock.calls;
    expect(second[1].skills).toEqual(first[1].skills);
    expect(second[1].skills.path_choices).toEqual({
      tribe: { 1: 'A', 4: 'B' },
      vocation: { 1: 'B', 4: 'A' },
    });
  });
});

describe('LevelUpWizard: falha ao gravar', () => {
  const toSummary = () => {
    renderWizard();
    next();
  };

  it('mostra a mensagem do erro e deixa tentar de novo', async () => {
    h.updateCharacter.mockRejectedValueOnce(new Error('sem rede'));
    toSummary();
    finish();

    expect(await screen.findByText('sem rede')).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Finalizar Progressão' })).toBeEnabled();

    finish();
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('sem rede')).toBeNull();
    expect(h.updateCharacter).toHaveBeenCalledTimes(2);
  });

  it('usa a mensagem padrão quando o erro não traz texto', async () => {
    h.updateCharacter.mockRejectedValueOnce({});
    toSummary();
    finish();

    expect(await screen.findByText('Erro ao salvar progressão')).toBeInTheDocument();
  });

  it('mostra Salvando e trava os botões enquanto grava', async () => {
    let resolve: () => void = () => {};
    h.updateCharacter.mockReturnValueOnce(new Promise<void>((r) => (resolve = r)));
    toSummary();
    finish();

    const saving = await screen.findByRole('button', { name: 'Salvando...' });
    expect(saving).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled();

    resolve();
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });
});
