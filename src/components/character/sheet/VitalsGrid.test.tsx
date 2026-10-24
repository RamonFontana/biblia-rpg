// As moedas da ficha mostram o valor arredondado; a carteira guarda o valor exato (preços chegam a
// 0,025 SP). Decisões: ROADMAP.md, Onda 4, passo 9d (Q15c). Termos: CONTEXT.md (Siclo).
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { VitalsGrid } from './VitalsGrid';

afterEach(cleanup);

const show = (coins: number | undefined) =>
  render(
    <VitalsGrid
      stats={{ pv: 10, current_pv: 10, ca: 11, faith: 50, current_faith: 50 }}
      coins={coins}
      totalAc={11}
      baseAc={11}
      bonusAc={0}
      resistances={[]}
      conditionResistanceLevels={{}}
    />,
  );

const sp = () => screen.getByText('SP').previousElementSibling?.textContent;

describe('VitalsGrid: moedas', () => {
  it('mostra as moedas inteiras como estão', () => {
    show(50);
    expect(sp()).toBe('50');
  });

  it('sem moedas mostra 0', () => {
    show(undefined);
    expect(sp()).toBe('0');
  });

  it('arredonda o valor fracionado na exibição', () => {
    show(49.975);
    expect(sp()).toBe('49.98');
  });
});
