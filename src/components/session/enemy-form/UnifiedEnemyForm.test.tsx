import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { findEnemyAbility } from '@/content/enemyAbilities';
import { ENEMY_PRESETS, findEnemyPreset } from '@/content/enemyPresets';
import { UnifiedEnemyForm } from './UnifiedEnemyForm';

afterEach(cleanup);

const setup = (initialValues?: Parameters<typeof UnifiedEnemyForm>[0]['initialValues']) => {
  const onSubmit = vi.fn();
  render(<UnifiedEnemyForm onSubmit={onSubmit} initialValues={initialValues} />);
  fireEvent.change(screen.getByPlaceholderText('Ex: Lobo Selvagem'), {
    target: { value: 'Anakim' },
  });
  return onSubmit;
};
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Salvar Inimigo' }));
const submitted = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls[0][0];

describe('UnifiedEnemyForm: Habilidades com efeito', () => {
  it('a biblioteca do bestiário adiciona a Habilidade com a referência e mostra o efeito', async () => {
    const onSubmit = setup();
    fireEvent.change(screen.getByLabelText('Adicionar da biblioteca'), {
      target: { value: 'enemy-presenca-aterradora' },
    });
    expect(screen.getByDisplayValue('Presença Aterradora')).toBeInTheDocument();
    expect(
      screen.getByText(/TR de Sabedoria CD 13 · Amedrontado \(10 rodadas\)/),
    ).toBeInTheDocument();
    save();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(submitted(onSubmit).skills).toEqual([
      expect.objectContaining({
        name: 'Presença Aterradora',
        libraryId: 'enemy-presenca-aterradora',
      }),
    ]);
  });

  it('uma Habilidade personalizada leva o efeito montado no editor', async () => {
    const onSubmit = setup();
    fireEvent.click(screen.getByRole('button', { name: /Adicionar$/ }));
    fireEvent.change(screen.getByPlaceholderText('Nome da habilidade'), {
      target: { value: 'Laço' },
    });
    fireEvent.click(screen.getByLabelText('Aplicar efeito no jogo'));
    fireEvent.change(screen.getByLabelText('Condição aplicada'), {
      target: { value: 'agarrado' },
    });
    save();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(submitted(onSubmit).skills).toEqual([
      expect.objectContaining({
        name: 'Laço',
        effect: { apply: [{ conditionId: 'agarrado' }], usage: 'unlimited' },
      }),
    ]);
  });

  it('uma Habilidade só com texto continua sem efeito', async () => {
    const onSubmit = setup();
    fireEvent.click(screen.getByRole('button', { name: /Adicionar$/ }));
    fireEvent.change(screen.getByPlaceholderText('Nome da habilidade'), {
      target: { value: 'Comando' },
    });
    save();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const [skill] = submitted(onSubmit).skills;
    expect(skill.libraryId).toBeUndefined();
    expect(skill.effect).toBeUndefined();
  });

  it('o Preset do Leão da Judeia traz o Salto e Bote da biblioteca', () => {
    const lion = findEnemyPreset('enemy-preset-leao-da-judeia');
    expect(lion?.abilities.map((ability) => ability.libraryId)).toEqual([
      undefined,
      'enemy-salto-e-bote',
    ]);
    expect(findEnemyAbility('enemy-salto-e-bote')).toBeDefined();
  });
});

describe('UnifiedEnemyForm: Preset do Bestiário', () => {
  // O Select do Radix usa APIs de ponteiro que o jsdom não tem.
  beforeAll(() => {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
    window.HTMLElement.prototype.setPointerCapture = () => undefined;
    window.HTMLElement.prototype.releasePointerCapture = () => undefined;
    window.HTMLElement.prototype.scrollIntoView = () => undefined;
  });

  // O Select do Preset vem antes do <select> da biblioteca de Habilidades.
  const presetTrigger = () => screen.getAllByRole('combobox')[0];

  const pick = (label: RegExp | string) => {
    fireEvent.keyDown(presetTrigger(), { key: 'ArrowDown' });
    fireEvent.click(screen.getByRole('option', { name: label }));
  };

  it('as Habilidades de biblioteca do Bestiário chegam ao inimigo criado', async () => {
    const expected = {
      'Guerreiro Anakim': 'enemy-presenca-aterradora',
      'Sacerdote de Baal': 'enemy-maldicao-de-baal',
      'Endemoniado Comum': 'enemy-grito-atormentador',
    };
    for (const [name, libraryId] of Object.entries(expected)) {
      const onSubmit = vi.fn();
      render(<UnifiedEnemyForm onSubmit={onSubmit} />);
      pick(new RegExp(`^${name}`));
      fireEvent.click(screen.getByRole('button', { name: 'Salvar Inimigo' }));
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(submitted(onSubmit).skills.map((s: { libraryId?: string }) => s.libraryId)).toContain(
        libraryId,
      );
      cleanup();
    }
  });

  it('lista os 10 Presets do Bestiário com PV e CA', () => {
    expect(ENEMY_PRESETS).toHaveLength(10);
    render(<UnifiedEnemyForm onSubmit={vi.fn()} />);
    fireEvent.keyDown(presetTrigger(), { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')).toHaveLength(ENEMY_PRESETS.length + 1);
    expect(
      screen.getByRole('option', { name: 'Leão da Judeia (PV: 26 | CA: 12)' }),
    ).toBeInTheDocument();
  });

  it('escolher o Preset preenche o formulário e criar leva a cópia e a origem', async () => {
    const onSubmit = vi.fn();
    render(<UnifiedEnemyForm onSubmit={onSubmit} />);
    pick(/^Bandido do Deserto/);
    expect(screen.getByPlaceholderText('Ex: Lobo Selvagem')).toHaveValue('Bandido do Deserto');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Inimigo' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(submitted(onSubmit)).toMatchObject({
      name: 'Bandido do Deserto',
      vocation: 'Médio, Humano, Neutro e Mau',
      hpMax: 11,
      hpCurrent: 11,
      ca: 12,
      attributes: { for: 11, des: 12, con: 12, int: 10, sab: 10, car: 10 },
      presetId: 'enemy-preset-bandido-do-deserto',
      details: { speed: '9 m', challenge: '1/8 (25 XP)' },
    });
    expect(submitted(onSubmit).attacks.map((a: { name: string }) => a.name)).toEqual([
      'Adaga de Bronze',
      'Funda',
    ]);
    expect(submitted(onSubmit).skills).toEqual([
      expect.objectContaining({ name: 'Ataque Furtivo' }),
    ]);
  });

  it('o inimigo é uma cópia: editar o PV não toca o Preset', async () => {
    const onSubmit = vi.fn();
    render(<UnifiedEnemyForm onSubmit={onSubmit} />);
    pick(/^Soldado Filisteu/);
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Inimigo' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(submitted(onSubmit).hpMax).toBe(20);
    expect(findEnemyPreset('enemy-preset-soldado-filisteu')?.hp).toBe(16);
  });

  it('"Nenhum" tira a origem e o bloco do Preset', async () => {
    const onSubmit = vi.fn();
    render(<UnifiedEnemyForm onSubmit={onSubmit} />);
    pick(/^Leão da Judeia/);
    pick(/^Nenhum/);
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Inimigo' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const data = submitted(onSubmit);
    expect(data.presetId).toBeUndefined();
    expect(data.attacks).toBeUndefined();
    expect(data.details).toBeUndefined();
  });

  it('um inimigo antigo, sem os campos do Preset, abre e salva igual', async () => {
    const onSubmit = setup({ name: 'Lobo', hpMax: 8, hpCurrent: 8, ca: 11 });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Inimigo' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(submitted(onSubmit)).toMatchObject({ hpMax: 8, ca: 11 });
    expect(submitted(onSubmit).presetId).toBeUndefined();
  });
});
