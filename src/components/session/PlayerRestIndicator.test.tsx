// O aviso de Descanso Longo para o jogador: aparece a partir do dia seguinte ao último (1 por dia, a
// mesma regra do botão do Mestre). O Descanso Curto é o cartão ShortRestCard (ADR 0006).
// Decisões: ROADMAP.md, Onda 4, passo 6c-3.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { PlayerRestIndicator } from './PlayerRestIndicator';

afterEach(cleanup);

const session = (over: Record<string, number> = {}) => ({
  current_day: 1,
  last_long_rest_day: 1,
  ...over,
});
const LONG = 'Descanso Longo Disponível (Mestre)';

describe('PlayerRestIndicator', () => {
  it('sem dados da sessão não desenha nada', () => {
    const { container } = render(<PlayerRestIndicator sessionData={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('no mesmo dia do último Descanso Longo, não desenha nada', () => {
    const { container } = render(<PlayerRestIndicator sessionData={session()} />);
    expect(container.firstChild).toBeNull();
  });

  it('o Longo aparece no dia seguinte ao último, não no mesmo dia', () => {
    const { rerender } = render(
      <PlayerRestIndicator sessionData={session({ current_day: 1, last_long_rest_day: 1 })} />,
    );
    expect(screen.queryByText(LONG)).toBeNull();
    rerender(
      <PlayerRestIndicator sessionData={session({ current_day: 2, last_long_rest_day: 1 })} />,
    );
    expect(screen.getByText(LONG)).toBeTruthy();
  });

  it('o aviso tem texto e ícone próprios (a cor é só reforço)', () => {
    const { container } = render(
      <PlayerRestIndicator sessionData={session({ current_day: 4, last_long_rest_day: 1 })} />,
    );
    expect(screen.getByText(LONG)).toBeTruthy();
    const icons = Array.from(container.querySelectorAll('svg')).map((svg) =>
      svg.getAttribute('class'),
    );
    expect(icons).toHaveLength(1);
    expect(icons[0]).toContain('lucide-moon');
  });

  it('não fala do Descanso Curto', () => {
    render(
      <PlayerRestIndicator sessionData={session({ current_day: 4, last_long_rest_day: 1 })} />,
    );
    expect(screen.queryByText(/Curto/)).toBeNull();
  });
});
