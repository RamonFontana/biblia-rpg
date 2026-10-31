// A Hotbar (ADR 0009): as Habilidades de quem age, em abas por espaço do turno, em peças com o nome
// escrito. Tocar, clicar, Enter ou segurar uma peça abre o Cartão de Habilidade logo acima, de onde
// se usa. Ela recebe as Habilidades já com os usos e o motivo de bloqueio e devolve o pedido de
// usar; quem a liga ao combate e à ficha é o `PlayerHotbar`. Termos: CONTEXT.md (Hotbar, Cartão
// de Habilidade, Habilidade).
import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Dices, X } from 'lucide-react';
import type { AbilityDefinition } from '@/content/schemas';
import { saveAttributeLabel } from '@/domain/abilitySave';
import { usePressToOpen } from '@/hooks/usePressToOpen';

export interface HotbarEntry {
  ability: AbilityDefinition;
  /** Usos que restam; `undefined` quando a Habilidade não tem limite de usos. */
  remainingUses?: number;
  /** Por que não pode ser usada agora; `null` quando pode. */
  blockedReason: string | null;
  /** A CD da Habilidade do personagem, quando ela impõe um TR. */
  cd?: number;
}

/** Um consumível do inventário que dá para usar agora. */
export interface HotbarItem {
  /** A linha do inventário (`character_items`). */
  id: string;
  name: string;
  quantity: number;
  description: string;
  /** Por que o item não pode ser usado agora, ou `null` (o Bálsamo fora do Descanso Curto). */
  blockedReason?: string | null;
}

/** A munição da arma equipada, só como contador (ela se gasta ao atacar). */
export interface HotbarAmmo {
  name: string;
  quantity: number;
}

interface HotbarProps {
  entries: HotbarEntry[];
  items?: HotbarItem[];
  ammo?: HotbarAmmo | null;
  onUseItem?: (item: HotbarItem) => void;
  /** Pede o uso. Devolve `'targets'` quando o Cartão deve seguir aberto para escolher alvos. */
  onUse: (ability: AbilityDefinition) => 'targets' | void;
  onOpenDice: () => void;
  /** Está gravando um uso: nenhum Usar vale enquanto isso. */
  busy?: boolean;
  /** A Habilidade cujo Cartão mostra a escolha de alvos no lugar do Usar. */
  targetingId?: string | null;
  renderTargeting?: (ability: AbilityDefinition) => ReactNode;
  /** O Cartão fechou com a escolha de alvos aberta. */
  onCancelUse?: () => void;
}

type Slot = 'action' | 'bonus' | 'reaction' | 'free';
type Tab = Slot | 'itens' | 'passivas';

const TAB_ORDER: Tab[] = ['action', 'bonus', 'reaction', 'free', 'itens', 'passivas'];
const TAB_LABEL: Record<Tab, string> = {
  action: 'Ação',
  bonus: 'Ação Bônus',
  reaction: 'Reação',
  free: 'Livre',
  itens: 'Itens',
  passivas: 'Passivas',
};
const SLOT_OF: Record<AbilityDefinition['actionType'], Tab> = {
  action: 'action',
  bonus_action: 'bonus',
  reaction: 'reaction',
  free_action: 'free',
  passive: 'passivas',
};
const TYPE_LABEL: Record<AbilityDefinition['actionType'], string> = {
  action: 'Ação',
  bonus_action: 'Ação Bônus',
  reaction: 'Reação',
  free_action: 'Ação Livre',
  passive: 'Passiva',
};
const USAGE_LABEL: Record<AbilityDefinition['usageType'], string> = {
  unlimited: 'Ilimitado',
  short_rest: 'por Descanso Curto',
  long_rest: 'por Descanso Longo',
  combat: 'por combate',
  week: 'por semana',
  campaign: 'por campanha',
  faith_cost: '',
};
const TARGET_LABEL = {
  enemy: 'um inimigo',
  enemies: 'inimigos',
  ally: 'um aliado',
  allies: 'aliados',
  aggressor: 'o agressor',
} as const;

/** "1 de 2 por Descanso Curto"; vazio quando a Habilidade não conta usos. */
function usesText(entry: HotbarEntry): string {
  const { ability } = entry;
  if (!ability.maxUses) return '';
  return `${entry.remainingUses ?? ability.maxUses} de ${ability.maxUses} ${USAGE_LABEL[ability.usageType]}`.trim();
}

/** O nome acessível da peça: "Golpe Sísmico, Ação, 1 de 1 por combate". */
function tileLabel(entry: HotbarEntry): string {
  const { ability } = entry;
  const parts = [ability.name, TYPE_LABEL[ability.actionType]];
  if (ability.actionType === 'passive') return parts.join(', ');
  if (usesText(entry)) parts.push(usesText(entry));
  if (ability.faithCost) parts.push(`custa ${ability.faithCost} de Fé`);
  return parts.join(', ');
}

/** A linha curta da peça: "1/1 · 10 Fé", "Ilimitado" ou "Passiva". */
function tileSub(entry: HotbarEntry): string {
  const { ability } = entry;
  if (ability.actionType === 'passive') return 'Passiva';
  const parts = [
    ability.maxUses ? `${entry.remainingUses ?? ability.maxUses}/${ability.maxUses}` : '',
    ability.faithCost ? `${ability.faithCost} Fé` : '',
  ].filter(Boolean);
  return parts.join(' · ') || 'Ilimitado';
}

export function Hotbar({
  entries,
  items = [],
  ammo = null,
  onUseItem,
  onUse,
  onOpenDice,
  busy = false,
  targetingId = null,
  renderTargeting,
  onCancelUse,
}: HotbarProps) {
  const itemCount = items.length + (ammo ? 1 : 0);
  const groups = TAB_ORDER.map((id) => ({
    id,
    entries: entries.filter((e) => SLOT_OF[e.ability.actionType] === id),
    count:
      id === 'itens'
        ? itemCount
        : entries.filter((e) => SLOT_OF[e.ability.actionType] === id).length,
  })).filter((g) => g.count > 0);

  const [chosen, setChosen] = useState<Tab>('action');
  const current = groups.find((g) => g.id === chosen) ?? groups[0];
  const [open, setOpen] = useState<{ kind: 'ability' | 'item'; id: string } | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  // O Cartão mostra sempre a Habilidade como está agora (os usos mudam depois de usar).
  const card = open?.kind === 'ability' ? entries.find((e) => e.ability.id === open.id) : undefined;
  const itemCard = open?.kind === 'item' ? items.find((i) => i.id === open.id) : undefined;

  const close = () => {
    if (targetingId) onCancelUse?.();
    setOpen(null);
    returnFocus.current?.focus();
  };

  const selectTab = (id: Tab) => {
    if (open) close();
    setChosen(id);
  };

  const onTabKey = (event: KeyboardEvent, index: number) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = groups[(index + step + groups.length) % groups.length];
    selectTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  const use = (entry: HotbarEntry) => {
    const outcome = onUse(entry.ability);
    if (outcome !== 'targets') close();
  };

  return (
    <div className="relative border-t border-stone-800 bg-stone-900">
      {(card || itemCard) && (
        <motion.div
          role="dialog"
          aria-label={card ? card.ability.name : itemCard?.name}
          className="absolute inset-x-2 bottom-full z-30 mb-2 max-h-[55dvh] overflow-y-auto rounded-xl border border-amber-500/40 bg-stone-900 p-4 shadow-2xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.8 }}
          onKeyDown={(event) => event.key === 'Escape' && close()}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <h2 className="font-serif text-lg text-amber-500">
              {card ? card.ability.name : itemCard?.name}
            </h2>
            <button
              type="button"
              autoFocus
              onClick={close}
              aria-label="Fechar"
              className="-mt-2 -mr-2 flex h-11 w-11 items-center justify-center text-stone-400 hover:text-stone-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {itemCard ? (
            <ItemCardBody
              item={itemCard}
              busy={busy}
              onUse={() => {
                onUseItem?.(itemCard);
                close();
              }}
            />
          ) : card && targetingId === card.ability.id && renderTargeting ? (
            renderTargeting(card.ability)
          ) : (
            card && <CardBody entry={card} busy={busy} onUse={() => use(card)} />
          )}
        </motion.div>
      )}

      <div className="flex items-end gap-1 px-2 pt-2">
        <div role="tablist" aria-label="Grupos da Hotbar" className="flex min-w-0 flex-1 gap-1">
          {groups.map((group, index) => (
            <button
              key={group.id}
              ref={(node) => {
                tabRefs.current[group.id] = node;
              }}
              type="button"
              role="tab"
              aria-selected={current?.id === group.id}
              tabIndex={current?.id === group.id ? 0 : -1}
              onClick={() => selectTab(group.id)}
              onKeyDown={(event) => onTabKey(event, index)}
              className={`relative h-11 min-w-0 flex-1 rounded-t-lg px-1 text-[11px] ${
                current?.id === group.id ? 'bg-stone-800 text-amber-400' : 'text-stone-400'
              }`}
            >
              {TAB_LABEL[group.id]} <span className="text-stone-500">{group.count}</span>
              {current?.id === group.id && (
                <motion.span
                  layoutId="hotbar-tab-underline"
                  className="absolute inset-x-2 bottom-0 h-0.5 bg-amber-500"
                />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Dados"
          onClick={onOpenDice}
          className="flex h-11 w-12 shrink-0 items-center justify-center rounded-t-lg text-stone-300 hover:text-amber-500"
        >
          <Dices className="h-6 w-6" />
        </button>
      </div>

      <div
        role="tabpanel"
        className="grid h-[9.5rem] grid-cols-3 content-start gap-2 overflow-y-auto bg-stone-800 p-2 sm:grid-cols-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
      >
        {!current && (
          <p className="col-span-full self-center text-center text-sm text-stone-400">
            Nenhuma habilidade disponível.
          </p>
        )}
        {current?.id === 'itens' && (
          <>
            {items.map((item) => (
              <ItemTile
                key={item.id}
                item={item}
                onOpen={(node) => {
                  returnFocus.current = node;
                  setOpen({ kind: 'item', id: item.id });
                }}
              />
            ))}
            {ammo && (
              <p className="flex min-h-[60px] items-center justify-center rounded-lg border border-stone-700 p-2 text-center text-xs text-stone-300">
                {`${ammo.name}: ${ammo.quantity}`}
              </p>
            )}
          </>
        )}
        {current?.entries.map((entry) => (
          <Tile
            key={entry.ability.id}
            entry={entry}
            onOpen={(node) => {
              returnFocus.current = node;
              setOpen({ kind: 'ability', id: entry.ability.id });
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Tile({ entry, onOpen }: { entry: HotbarEntry; onOpen: (node: HTMLElement) => void }) {
  const node = useRef<HTMLButtonElement>(null);
  const press = usePressToOpen(() => node.current && onOpen(node.current));
  const passive = entry.ability.actionType === 'passive';
  const blocked = !passive && entry.blockedReason !== null;
  return (
    <motion.button
      ref={node}
      type="button"
      aria-label={tileLabel(entry)}
      data-blocked={blocked ? '' : undefined}
      data-passive={passive ? '' : undefined}
      {...press}
      whileTap={{ scale: 0.94 }}
      className={`flex min-h-[60px] items-center rounded-lg p-2 text-left select-none [-webkit-touch-callout:none] ${
        passive
          ? 'border border-dashed border-stone-600 text-stone-400'
          : 'border border-amber-500/40 bg-stone-900 text-stone-100'
      } ${blocked ? 'opacity-40' : ''}`}
    >
      <span className="min-w-0">
        <span className="line-clamp-2 block text-[11px] leading-tight">{entry.ability.name}</span>
        <span className="block text-[10px] text-stone-500">{tileSub(entry)}</span>
      </span>
    </motion.button>
  );
}

function CardBody({
  entry,
  busy,
  onUse,
}: {
  entry: HotbarEntry;
  busy: boolean;
  onUse: () => void;
}) {
  const { ability } = entry;
  const passive = ability.actionType === 'passive';
  const save = ability.combatEffect?.save;
  const target = ability.combatEffect && TARGET_LABEL[ability.combatEffect.targets];
  const uses = usesText(entry) || (ability.usageType === 'unlimited' ? 'Ilimitado' : '');
  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-1.5 text-[11px]">
        <li className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-500">
          {TYPE_LABEL[ability.actionType]}
        </li>
        {ability.path && (
          <li className="rounded border border-amber-500/30 px-2 py-0.5 text-amber-500">
            Caminho {ability.path}
          </li>
        )}
        {!passive && ability.faithCost && (
          <li className="rounded border border-stone-700 px-2 py-0.5 text-stone-300">
            Custo: {ability.faithCost} de Fé
          </li>
        )}
        {!passive && uses && (
          <li className="rounded border border-stone-700 px-2 py-0.5 text-stone-300">{uses}</li>
        )}
      </ul>
      {save && (
        <p className="text-sm text-stone-300">
          TR de {saveAttributeLabel(save.attribute)}
          {entry.cd !== undefined && ` · CD ${entry.cd}`}
        </p>
      )}
      {target && <p className="text-sm text-stone-300">Alvos: {target}</p>}
      <p className="text-sm text-stone-400">{ability.effect}</p>
      {!passive && (
        <div className="space-y-1">
          <button
            type="button"
            disabled={busy || entry.blockedReason !== null}
            onClick={onUse}
            className="h-12 w-full rounded bg-amber-600 font-bold text-stone-900 transition-colors hover:bg-amber-500 disabled:opacity-50"
          >
            Usar
          </button>
          {entry.blockedReason && (
            <p className="text-center text-xs font-medium text-red-400">{entry.blockedReason}</p>
          )}
        </div>
      )}
    </div>
  );
}

const unitsText = (quantity: number) => `${quantity} ${quantity === 1 ? 'unidade' : 'unidades'}`;

function ItemTile({ item, onOpen }: { item: HotbarItem; onOpen: (node: HTMLElement) => void }) {
  const node = useRef<HTMLButtonElement>(null);
  const press = usePressToOpen(() => node.current && onOpen(node.current));
  return (
    <motion.button
      ref={node}
      type="button"
      aria-label={`${item.name}, ${unitsText(item.quantity)}`}
      {...press}
      whileTap={{ scale: 0.94 }}
      className="flex min-h-[60px] items-center rounded-lg border border-stone-600 bg-stone-900 p-2 text-left text-stone-100 select-none [-webkit-touch-callout:none]"
    >
      <span className="min-w-0">
        <span className="line-clamp-2 block text-[11px] leading-tight">{item.name}</span>
        <span className="block text-[10px] text-stone-500">×{item.quantity}</span>
      </span>
    </motion.button>
  );
}

function ItemCardBody({
  item,
  busy,
  onUse,
}: {
  item: HotbarItem;
  busy: boolean;
  onUse: () => void;
}) {
  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-1.5 text-[11px]">
        <li className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-500">Consumível</li>
        <li className="rounded border border-stone-700 px-2 py-0.5 text-stone-300">
          {unitsText(item.quantity)}
        </li>
      </ul>
      <p className="text-sm text-stone-400">{item.description}</p>
      <button
        type="button"
        disabled={busy || !!item.blockedReason}
        onClick={onUse}
        className="h-12 w-full rounded bg-amber-600 font-bold text-stone-900 transition-colors hover:bg-amber-500 disabled:opacity-50"
      >
        Usar
      </button>
      {item.blockedReason && (
        <p className="text-center text-xs font-medium text-red-400">{item.blockedReason}</p>
      )}
    </div>
  );
}
