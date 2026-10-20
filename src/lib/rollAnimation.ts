export interface RollAnimation {
  /** Duração total, em ms, até o valor final. */
  duration: number;
  /** Intervalo entre dois números sorteados no começo (rápido) e no fim (devagar), em ms. */
  minInterval: number;
  maxInterval: number;
  /** Mostra um número intermediário. */
  onTick: () => void;
  /** Fecha a rolagem: chamado uma vez, depois da duração. */
  onFinish: () => void;
  /** Para a animação quando devolve `false` (por exemplo, a tela foi desmontada). */
  isActive: () => boolean;
}

/**
 * Animação do dado virtual: troca o número várias vezes, cada vez mais devagar (o intervalo cresce
 * com o quadrado do progresso) e termina com `onFinish`.
 */
export function animateRoll(options: RollAnimation): void {
  const { duration, minInterval, maxInterval, onTick, onFinish, isActive } = options;
  let elapsed = 0;

  const step = () => {
    if (!isActive()) return;

    const progress = elapsed / duration;
    const interval = minInterval + (maxInterval - minInterval) * Math.pow(progress, 2);

    if (elapsed >= duration) {
      onFinish();
    } else {
      onTick();
      elapsed += interval;
      setTimeout(step, interval);
    }
  };

  step();
}
