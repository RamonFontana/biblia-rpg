import * as React from 'react';

import { cn } from '@/lib/utils';

interface ChipToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

/** Chip de escolha ou de navegação: âmbar cheio quando ativo, pedra quando não. */
const ChipToggle = React.forwardRef<HTMLButtonElement, ChipToggleProps>(
  ({ active, className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={cn(
        'px-3 py-1 rounded text-sm',
        active
          ? 'bg-amber-600 text-stone-900 font-bold'
          : 'bg-stone-700 text-stone-300 hover:bg-stone-600',
        className,
      )}
      {...props}
    />
  ),
);
ChipToggle.displayName = 'ChipToggle';

export { ChipToggle };
