// O Mestre aplica uma Condição a um alvo: se o alvo tem Resistência a Condição (armadura, escudo,
// elmo), a janela mostra o efeito e aplica já com ele; o Mestre pode ignorar a resistência.
// Decisões: ROADMAP.md, Onda 3 (passo 6). Termos: CONTEXT.md (Resistência a Condição).
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ConditionSelector } from './ConditionSelector';

// O Select do Radix usa APIs que o jsdom não tem.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(cleanup);

function setup(resistanceLevels?: Record<string, number>) {
  const onAdd = vi.fn();
  render(<ConditionSelector onAddCondition={onAdd} resistanceLevels={resistanceLevels} />);
  fireEvent.click(screen.getByRole('button', { name: /Adicionar Efeito/ }));
  return onAdd;
}

function pick(conditionName: string) {
  fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
  fireEvent.click(within(screen.getByRole('listbox')).getByText(conditionName));
}

const setDuration = (value: number) =>
  fireEvent.change(screen.getByLabelText(/Duração/), { target: { value: String(value) } });

const apply = () => fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

describe('ConditionSelector: alvo sem resistência', () => {
  it('aplica a Condição e a duração como o Mestre digitou, sem avisos', () => {
    const onAdd = setup({});
    pick('Sangrando');
    setDuration(4);
    expect(screen.queryByText(/Resistência/)).toBeNull();
    apply();
    expect(onAdd).toHaveBeenCalledWith('sangrando', 4);
  });

  it('duração 0 continua significando permanente', () => {
    const onAdd = setup();
    pick('Cego');
    apply();
    expect(onAdd).toHaveBeenCalledWith('cego', 0);
  });
});

describe('ConditionSelector: alvo com Resistência a Condição', () => {
  it('nível 2: mostra o efeito e aplica com a metade da duração (para cima)', () => {
    const onAdd = setup({ sangrando: 2 });
    pick('Sangrando');
    setDuration(5);
    expect(
      screen.getByText('Resistência Nv2: duração de Sangrando reduzida pela metade'),
    ).toBeTruthy();
    expect(screen.getByText(/5 → 3 turnos/)).toBeTruthy();
    apply();
    expect(onAdd).toHaveBeenCalledWith('sangrando', 3);
  });

  it('nível 1: avisa da vantagem e aplica a duração inteira', () => {
    const onAdd = setup({ cego: 1 });
    pick('Cego');
    setDuration(3);
    expect(
      screen.getByText('Resistência Nv1: vantagem no teste de resistência contra Cego'),
    ).toBeTruthy();
    apply();
    expect(onAdd).toHaveBeenCalledWith('cego', 3);
  });

  it('permanente continua permanente, e a janela diz que a resistência não muda nada', () => {
    const onAdd = setup({ sangrando: 2 });
    pick('Sangrando');
    expect(screen.getByText(/a condição não tem duração/)).toBeTruthy();
    apply();
    expect(onAdd).toHaveBeenCalledWith('sangrando', 0);
  });

  it('nível 4: o alvo é imune e Aplicar fica desligado', () => {
    const onAdd = setup({ sangrando: 4 });
    pick('Sangrando');
    setDuration(3);
    expect(screen.getByText('Resistência Nv4: imune a Sangrando')).toBeTruthy();
    const applyButton = screen.getByRole('button', { name: 'Aplicar' }) as HTMLButtonElement;
    expect(applyButton.disabled).toBe(true);
    fireEvent.click(applyButton);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('o Mestre pode ignorar a resistência: aplica como digitou, até em alvo imune', () => {
    const onAdd = setup({ sangrando: 4 });
    pick('Sangrando');
    setDuration(3);
    fireEvent.click(screen.getByRole('checkbox', { name: /Ignorar a resistência/ }));
    const applyButton = screen.getByRole('button', { name: 'Aplicar' }) as HTMLButtonElement;
    expect(applyButton.disabled).toBe(false);
    apply();
    expect(onAdd).toHaveBeenCalledWith('sangrando', 3);
  });

  it('a resistência é por Condição: outra Condição do mesmo alvo não é afetada', () => {
    const onAdd = setup({ sangrando: 4 });
    pick('Envenenado');
    setDuration(3);
    expect(screen.queryByText(/Resistência/)).toBeNull();
    apply();
    expect(onAdd).toHaveBeenCalledWith('envenenado', 3);
  });

  it('trocar de Condição desmarca o "ignorar", para não passar por cima de outra resistência', () => {
    setup({ sangrando: 4, cego: 4 });
    pick('Sangrando');
    fireEvent.click(screen.getByRole('checkbox', { name: /Ignorar a resistência/ }));
    pick('Cego');
    const box = screen.getByRole('checkbox', { name: /Ignorar a resistência/ });
    expect(box.getAttribute('aria-checked')).toBe('false');
  });
});
