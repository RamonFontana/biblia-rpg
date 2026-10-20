import * as React from 'react';

import { cn } from '@/lib/utils';

interface ProgressBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  value: number;
  /** O valor que enche a barra; 100 se omitido. */
  max?: number;
}

/** A parte cheia da barra, de 0 a 100 (valores fora do intervalo ficam nos extremos). */
function fillPercent(value: number, max: number) {
  if (!(max > 0)) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

/** Barra de progresso: trilho de pedra com preenchimento âmbar. */
const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, max = 100, className, ...props }, ref) => (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('w-full bg-stone-700 h-2 rounded-full overflow-hidden', className)}
      {...props}
    >
      <div
        className="bg-amber-500 h-full transition-all duration-300"
        style={{ width: `${fillPercent(value, max)}%` }}
      />
    </div>
  ),
);
ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
