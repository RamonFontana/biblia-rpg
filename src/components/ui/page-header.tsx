import * as React from 'react';

import { cn } from '@/lib/utils';

interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode;
  /** A linha sob o título ("Passo 3 de 9"). */
  subtitle?: React.ReactNode;
}

/** O cabeçalho de uma página: título em serifa âmbar, uma linha de apoio e, nos filhos, o que mais couber (progresso, chips). */
const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  ({ title, subtitle, className, children, ...props }, ref) => (
    <header ref={ref} className={cn('mb-8 border-b border-stone-700 pb-4', className)} {...props}>
      <h1 className="text-3xl font-serif text-amber-500">{title}</h1>
      {subtitle && <p className="text-stone-400 mt-2">{subtitle}</p>}
      {children}
    </header>
  ),
);
PageHeader.displayName = 'PageHeader';

export { PageHeader };
