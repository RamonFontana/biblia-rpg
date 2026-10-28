import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { EnemyAbilityEffect } from '@/content/schemas';
import { EnemyAbilityEffectEditor } from './EnemyAbilityEffectEditor';

afterEach(cleanup);

const setup = (value?: EnemyAbilityEffect) => {
  const onChange = vi.fn();
  render(<EnemyAbilityEffectEditor value={value} onChange={onChange} />);
  return onChange;
};
const last = (fn: ReturnType<typeof vi.fn>) => fn.mock.calls[fn.mock.calls.length - 1][0];

describe('EnemyAbilityEffectEditor', () => {
  it('sem efeito, só mostra a opção de dar um efeito à Habilidade', () => {
    setup();
    expect(screen.getByLabelText('Aplicar efeito no jogo')).not.toBeChecked();
    expect(screen.queryByLabelText('Atributo do TR')).not.toBeInTheDocument();
  });

  it('ligar o efeito mostra os campos, ainda sem efeito válido', () => {
    const onChange = setup();
    fireEvent.click(screen.getByLabelText('Aplicar efeito no jogo'));
    expect(screen.getByLabelText('Atributo do TR')).toBeInTheDocument();
    expect(screen.getByText(/Escolha uma Condição ou a perda de Fé/)).toBeInTheDocument();
    expect(last(onChange)).toBeUndefined();
  });

  it('monta o efeito com TR, Condição, duração, perda de Fé e uso', () => {
    const onChange = setup();
    fireEvent.click(screen.getByLabelText('Aplicar efeito no jogo'));
    fireEvent.change(screen.getByLabelText('Atributo do TR'), { target: { value: 'sab' } });
    fireEvent.change(screen.getByLabelText('CD do TR'), { target: { value: '14' } });
    fireEvent.change(screen.getByLabelText('Condição aplicada'), {
      target: { value: 'amedrontado' },
    });
    fireEvent.change(screen.getByLabelText('Duração em rodadas'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Dado de Fé perdida'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Uso'), { target: { value: 'recharge' } });
    expect(last(onChange)).toEqual({
      save: { attribute: 'sab', cd: 14 },
      apply: [{ conditionId: 'amedrontado', rounds: 10 }],
      faithLoss: { sides: 4 },
      usage: 'recharge',
    });
  });

  it('sem duração, a Condição fica até ser removida', () => {
    const onChange = setup();
    fireEvent.click(screen.getByLabelText('Aplicar efeito no jogo'));
    fireEvent.change(screen.getByLabelText('Condição aplicada'), { target: { value: 'caido' } });
    expect(last(onChange)).toEqual({ apply: [{ conditionId: 'caido' }], usage: 'unlimited' });
  });

  it('carrega um efeito existente nos campos', () => {
    setup({
      save: { attribute: 'for', cd: 13 },
      apply: [{ conditionId: 'caido' }],
      usage: 'per_combat',
    });
    expect(screen.getByLabelText('Aplicar efeito no jogo')).toBeChecked();
    expect(screen.getByLabelText('Atributo do TR')).toHaveValue('for');
    expect(screen.getByLabelText('CD do TR')).toHaveValue(13);
    expect(screen.getByLabelText('Condição aplicada')).toHaveValue('caido');
    expect(screen.getByLabelText('Uso')).toHaveValue('per_combat');
  });

  it('a CD do TR só aparece com um atributo escolhido', () => {
    setup();
    fireEvent.click(screen.getByLabelText('Aplicar efeito no jogo'));
    expect(screen.queryByLabelText('CD do TR')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Atributo do TR'), { target: { value: 'des' } });
    expect(screen.getByLabelText('CD do TR')).toBeInTheDocument();
  });

  it('desligar o efeito volta a Habilidade a texto', () => {
    const onChange = setup({ apply: [{ conditionId: 'caido' }], usage: 'unlimited' });
    fireEvent.click(screen.getByLabelText('Aplicar efeito no jogo'));
    expect(last(onChange)).toBeUndefined();
  });

  it('uma CD fora de 1 a 40 não gera efeito', () => {
    const onChange = setup();
    fireEvent.click(screen.getByLabelText('Aplicar efeito no jogo'));
    fireEvent.change(screen.getByLabelText('Atributo do TR'), { target: { value: 'sab' } });
    fireEvent.change(screen.getByLabelText('Condição aplicada'), { target: { value: 'caido' } });
    fireEvent.change(screen.getByLabelText('CD do TR'), { target: { value: '99' } });
    expect(last(onChange)).toBeUndefined();
  });
});
