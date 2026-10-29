// O trilho de ícones na borda do Palco (ADR 0009): cada botão abre um Painel. Um selo âmbar marca
// o que pede atenção. Termos: CONTEXT.md (Painel, Palco).
import type { ReactNode } from 'react';

export interface DockItem<Id extends string = string> {
  id: Id;
  label: string;
  icon: ReactNode;
  /** Há algo pedindo atenção neste Painel (descanso aberto, pedido recusado, troca pendente). */
  attention?: boolean;
}

interface DockRailProps<Id extends string> {
  items: DockItem<Id>[];
  onOpen: (id: Id) => void;
}

export function DockRail<Id extends string>({ items, onOpen }: DockRailProps<Id>) {
  return (
    <nav
      aria-label="Painéis"
      className="absolute top-2 right-2 z-20 flex flex-col gap-1 rounded-full border border-stone-700 bg-stone-900/90 p-1.5 md:static md:rounded-none md:border-0 md:border-l md:bg-stone-900 md:p-2"
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-label={item.label}
          title={item.label}
          data-attention={item.attention ? '' : undefined}
          onClick={() => onOpen(item.id)}
          className="relative flex h-12 w-12 items-center justify-center rounded-full text-stone-300 hover:bg-stone-800 hover:text-amber-500"
        >
          {item.icon}
          {item.attention && (
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-amber-500"
            />
          )}
        </button>
      ))}
    </nav>
  );
}
