import * as React from 'react';

import { cn } from '@/lib/utils';

/** O fundo da página: pedra escura, tela cheia, sem folga no celular. Receita: docs/DESIGN.md. */
const PageShell = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('min-h-screen bg-stone-900 text-stone-100 p-0 sm:p-4 md:p-8', className)}
      {...props}
    />
  ),
);
PageShell.displayName = 'PageShell';

export { PageShell };
