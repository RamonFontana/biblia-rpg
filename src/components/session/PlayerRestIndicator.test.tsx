// Os avisos de Descanso para o jogador: o Curto está disponível enquanto o dia teve menos de 2;
// o Longo, quando passaram 2 dias desde o último. Cada aviso tem texto e ícone próprios (a cor
// é só reforço). Decisões: ROADMAP.md, Onda 4, passo 6c-3.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { PlayerRestIndicator } from './PlayerRestIndicator';

afterEach(cleanup);

const session = (over: Record<string, number> = {}) => ({
  short_rests_today: 0,
  current_day: 1,
  last_long_rest_day: 1,
  ...over,
});
const SHORT = 'Descanso Curto Disponível (Mestre)';
const LONG = 'Descanso Longo Disponível (Mestre)';

describe('PlayerRestIndicator', () => {
  it('sem dados da sessão não desenha nada', () => {
    const { container } = render(<PlayerRestIndicator sessionData={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('no começo do dia só o Curto está disponível', () => {
    render(<PlayerRestIndicator sessionData={session()} />);
    expect(screen.getByText(SHORT)).toBeTruthy();
    expect(screen.queryByText(LONG)).toBeNull();
  });

  it('o Curto vale enquanto houve menos de 2 no dia', () => {
    render(<PlayerRestIndicator sessionData={session({ short_rests_today: 1 })} />);
    expect(screen.getByText(SHORT)).toBeTruthy();
  });

  it('depois de 2 Descansos Curtos no dia, o Curto some', () => {
    render(
      <PlayerRestIndicator
        sessionData={session({ short_rests_today: 2, current_day: 3, last_long_rest_day: 1 })}
      />,
    );
    expect(screen.queryByText(SHORT)).toBeNull();
    expect(screen.getByText(LONG)).toBeTruthy();
  });

  it('o Longo aparece 2 dias depois do último, não antes', () => {
    const { rerender } = render(
      <PlayerRestIndicator sessionData={session({ current_day: 2, last_long_rest_day: 1 })} />,
    );
    expect(screen.queryByText(LONG)).toBeNull();
    rerender(
      <PlayerRestIndicator sessionData={session({ current_day: 3, last_long_rest_day: 1 })} />,
    );
    expect(screen.getByText(LONG)).toBeTruthy();
  });

  it('com os dois disponíveis, mostra os dois, com ícones diferentes', () => {
    const { container } = render(
      <PlayerRestIndicator sessionData={session({ current_day: 4, last_long_rest_day: 1 })} />,
    );
    expect(screen.getByText(SHORT)).toBeTruthy();
    expect(screen.getByText(LONG)).toBeTruthy();
    const icons = Array.from(container.querySelectorAll('svg')).map((svg) =>
      svg.getAttribute('class'),
    );
    expect(icons).toHaveLength(2);
    expect(icons[0]).toContain('lucide-coffee');
    expect(icons[1]).toContain('lucide-moon');
  });

  it('sem nenhum dos dois, não desenha nada', () => {
    const { container } = render(
      <PlayerRestIndicator
        sessionData={session({ short_rests_today: 2, current_day: 1, last_long_rest_day: 1 })}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
