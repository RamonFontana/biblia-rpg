import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * O painel central de uma página: ocupa a tela inteira no celular, sem borda nem cantos, e ganha a
 * moldura (borda, cantos, sombra) a partir de `sm`. Vai dentro de um `PageShell`; para um bloco
 * menor dentro da página, use `Card`.
 */
const Panel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'max-w-4xl mx-auto bg-stone-800 p-4 sm:p-6 rounded-none sm:rounded-xl shadow-none sm:shadow-lg border-0 sm:border border-stone-700 min-h-screen sm:min-h-0',
        className,
      )}
      {...props}
    />
  ),
);
Panel.displayName = 'Panel';

export { Panel };
