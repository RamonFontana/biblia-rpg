// A conta que o app faz pelo jogador no Teste: dado + modificador (+ proficiência) = total. A
// proficiência só aparece quando existe. Decisões: ROADMAP.md, Onda 4, passo 6c-4.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { BonusBreakdown } from './BonusBreakdown';

afterEach(cleanup);

describe('BonusBreakdown', () => {
  it('dado + modificador + proficiência = total', () => {
    render(<BonusBreakdown roll={12} modifiers={{ attrMod: 3, profBonus: 2 }} />);
    expect(screen.getByText('Dado').nextSibling?.textContent).toBe('12');
    expect(screen.getByText('Mod').nextSibling?.textContent).toBe('+3');
    expect(screen.getByText('Prof').nextSibling?.textContent).toBe('+2');
    expect(screen.getByText('Total').nextSibling?.textContent).toBe('17');
  });

  it('sem proficiência, a coluna "Prof" não aparece e o total é dado + modificador', () => {
    render(<BonusBreakdown roll={12} modifiers={{ attrMod: 3, profBonus: 0 }} />);
    expect(screen.queryByText('Prof')).toBeNull();
    expect(screen.getByText('Total').nextSibling?.textContent).toBe('15');
  });

  it('modificador negativo aparece com o sinal e baixa o total', () => {
    render(<BonusBreakdown roll={12} modifiers={{ attrMod: -2, profBonus: 2 }} />);
    expect(screen.getByText('Mod').nextSibling?.textContent).toBe('-2');
    expect(screen.getByText('Total').nextSibling?.textContent).toBe('12');
  });

  it('modificador zero leva o sinal +', () => {
    render(<BonusBreakdown roll={5} modifiers={{ attrMod: 0, profBonus: 0 }} />);
    expect(screen.getByText('Mod').nextSibling?.textContent).toBe('+0');
  });

  it('o modificador e a proficiência não têm a mesma aparência', () => {
    render(<BonusBreakdown roll={5} modifiers={{ attrMod: 1, profBonus: 2 }} />);
    expect((screen.getByText('Mod').nextSibling as HTMLElement).className).not.toBe(
      (screen.getByText('Prof').nextSibling as HTMLElement).className,
    );
  });
});
