import { Target, ShieldPlus, Zap } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CharacterEquipment, WeaponEffect } from '@/types/combat';
import { canEquipItem } from '@/lib/equipmentUtils';
import { ITEMS_DB } from '@/content/items';
import { CONDITIONS } from '@/content/conditions';
import { resolveHealing } from '@/domain/consumables';
import { formatItemArmorClass } from '@/domain/armorClass';
import { getItemConditionResistances } from '@/domain/armorResistance';
import { ItemResistances } from './ItemResistances';

interface InventoryListProps {
  inventoryItems: any[];
  equipment: CharacterEquipment | null;
  onEquip: (characterItemId: string, itemEffects: any, targetHand?: 'mainHand' | 'offHand') => void;
  onUseConsumable: (item: any) => void;
  isUpdating: boolean;
  isGM?: boolean;
  onChangeLevel?: (characterItemId: string, newLevel: number) => void;
  onChangeResistances?: (characterItemId: string, newResistances: string[]) => void;
  onChangeWeaponEffects?: (characterItemId: string, effects: WeaponEffect[]) => void;
  onConsumeAmmunition?: (characterItemId: string) => void;
  onRecoverAmmunition?: (characterItemId: string, spentAmount: number, maxCapacity: number) => void;
  onAddCharges?: (characterItemId: string, amount: number) => void;
  onRemoveItem?: (characterItemId: string) => void;
}

/** Dica do botão Equipar: o que o item dá, com o elmo avisando que não dá CA. */
function equipTitle(slug?: string | null): string | undefined {
  const armorClass = formatItemArmorClass({ slug });
  const resistances = getItemConditionResistances(slug).map((id) => CONDITIONS[id]?.name ?? id);
  const parts = [
    armorClass ?? (resistances.length > 0 ? 'Não dá CA' : null),
    resistances.length > 0 ? `Resiste: ${resistances.join(', ')}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

const AVAILABLE_RESISTANCES = ['Corte', 'Perfuração', 'Impacto', 'Fogo', 'Frio', 'Ácido', 'Veneno'];

export function InventoryList({
  inventoryItems,
  equipment,
  onEquip,
  onUseConsumable,
  isUpdating,
  isGM,
  onChangeLevel,
  onChangeResistances,
  onChangeWeaponEffects,
  onConsumeAmmunition,
  onRecoverAmmunition,
  onAddCharges,
  onRemoveItem,
}: InventoryListProps) {
  if (inventoryItems.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-stone-300 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
          <Target className="w-5 h-5 text-amber-500" />
          Inventário
        </h3>
        <p className="text-sm text-stone-500 italic">Inventário vazio.</p>
      </div>
    );
  }

  // Sort items to maintain stable order (alphabetically by name, fallback to id)
  const sortedItems = [...inventoryItems].sort((a, b) => {
    const nameA = a.items?.name || '';
    const nameB = b.items?.name || '';
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return a.id.localeCompare(b.id);
  });

  // Group items by category
  const groupedItems = sortedItems.reduce(
    (acc, curr) => {
      const category = curr.items?.category || 'Outros';
      if (!acc[category]) acc[category] = [];
      acc[category].push(curr);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  return (
    <div>
      <h3 className="text-lg font-semibold text-stone-300 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
        <Target className="w-5 h-5 text-amber-500" />
        Inventário
      </h3>
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="space-y-2">
            <h4 className="text-sm font-bold text-amber-500/80 uppercase tracking-wider mb-2">
              {category}
            </h4>
            <div className="space-y-2">
              {(items as any[]).map((item: any) => {
                const itemEffects = item.items?.effects || {};
                const dbItem = ITEMS_DB.find((i) => i.name === item.items?.name);
                const itemType = dbItem?.type || item.items?.category;
                let itemSlot = itemEffects.slot || dbItem?.slot;

                // Infer slot from category if missing
                if (!itemSlot) {
                  const category = item.items?.category?.toUpperCase() || '';
                  const type = itemType?.toUpperCase() || '';
                  const properties = item.items?.effects?.properties || [];
                  const description =
                    item.items?.description?.toUpperCase() ||
                    dbItem?.description?.toUpperCase() ||
                    '';

                  if (properties.includes('two-handed') || description.includes('DUAS MÃOS')) {
                    itemSlot = '2h';
                  } else if (
                    type === 'ARMA' ||
                    category.includes('SIMPLES') ||
                    category.includes('MARCIAL')
                  ) {
                    itemSlot = '1h'; // Default to 1h
                  } else if (
                    item.items?.name?.toUpperCase().includes('CHAPÉU') ||
                    item.items?.name?.toUpperCase().includes('ELMO') ||
                    item.items?.name?.toUpperCase().includes('CAPUZ') ||
                    type === 'ELMO'
                  ) {
                    itemSlot = 'head';
                  } else if (
                    type === 'ARMADURA' ||
                    category.includes('LEVE') ||
                    category.includes('MÉDI') ||
                    category.includes('PESAD') ||
                    category.includes('ARMADURA')
                  ) {
                    itemSlot = 'body';
                  } else if (type === 'ESCUDO' || category.includes('ESCUDO')) {
                    itemSlot = 'shield';
                  }
                }

                const normalizedEffects = { ...itemEffects, slot: itemSlot };

                // Fallback and scaling logic for healing
                const level = item.level || 1;
                const healing = resolveHealing(
                  normalizedEffects.heal_dice,
                  normalizedEffects.heal,
                  dbItem?.description,
                  level,
                );
                if (healing.healDice) {
                  normalizedEffects.heal_dice = healing.healDice;
                } else if (healing.heal) {
                  normalizedEffects.heal = healing.heal;
                }

                const isEquipped2h =
                  equipment?.mainHand === item.id && equipment?.offHand === item.id;
                let damageDie = normalizedEffects.damageDie;
                if (isEquipped2h && normalizedEffects.versatileDamageDie) {
                  damageDie = normalizedEffects.versatileDamageDie;
                }

                const displayDamage = damageDie
                  ? `${damageDie}${normalizedEffects.damageType ? ' ' + normalizedEffects.damageType : ''}`
                  : dbItem?.damage;

                const equippedCount =
                  (equipment?.head === item.id ? 1 : 0) +
                  (equipment?.body === item.id ? 1 : 0) +
                  (equipment?.mainHand === item.id && itemSlot !== '2h' ? 1 : 0) +
                  (equipment?.offHand === item.id && itemSlot !== '2h' ? 1 : 0) +
                  // For 2h weapons, they occupy both hands but count as 1 item equipped
                  (equipment?.mainHand === item.id &&
                  equipment?.offHand === item.id &&
                  itemSlot === '2h'
                    ? 1
                    : 0);

                const isEquipped = equippedCount > 0;
                const fullyEquipped =
                  equippedCount >= item.quantity || (itemSlot !== '1h' && equippedCount >= 1);

                const isEquippable =
                  !!itemSlot &&
                  canEquipItem(
                    normalizedEffects,
                    equipment || { head: null, body: null, mainHand: null, offHand: null },
                  );

                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-stone-900 border border-stone-800 rounded-lg group hover:border-stone-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-200 font-medium">{item.items?.name}</span>
                        {isGM ? (
                          <>
                            <div className="flex items-center gap-1 bg-stone-800 rounded border border-stone-700 h-5">
                              <button
                                onClick={() =>
                                  onChangeLevel?.(item.id, Math.max(1, (item.level || 1) - 1))
                                }
                                className="text-stone-400 hover:text-white px-1.5 flex items-center justify-center disabled:opacity-30"
                                disabled={isUpdating || (item.level || 1) <= 1}
                              >
                                -
                              </button>
                              <span
                                className="text-[10px] text-amber-200 font-bold w-7 text-center leading-none"
                                title="Nível do Item"
                              >
                                Nv.{item.level || 1}
                              </span>
                              <button
                                onClick={() =>
                                  onChangeLevel?.(item.id, Math.min(5, (item.level || 1) + 1))
                                }
                                className="text-stone-400 hover:text-white px-1.5 flex items-center justify-center disabled:opacity-30"
                                disabled={isUpdating || (item.level || 1) >= 5}
                              >
                                +
                              </button>
                            </div>

                            {itemType !== 'Arma' &&
                              itemType !== 'Consumível' &&
                              itemType !== 'Utilidade' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      className="h-5 px-1.5 bg-stone-800 rounded border border-stone-700 text-stone-400 hover:text-white transition-colors flex items-center justify-center"
                                      title="Adicionar Resistências"
                                    >
                                      <ShieldPlus className="w-3 h-3" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    className="w-48 bg-stone-900 border-stone-800 text-stone-200"
                                    align="start"
                                  >
                                    <div className="px-2 py-1.5 text-xs font-semibold text-stone-400">
                                      Resistências Customizadas
                                    </div>
                                    {AVAILABLE_RESISTANCES.map((res) => {
                                      const isChecked = (
                                        item.custom_condition_resistances || []
                                      ).includes(res);
                                      return (
                                        <DropdownMenuCheckboxItem
                                          key={res}
                                          checked={isChecked}
                                          onCheckedChange={(checked) => {
                                            if (!onChangeResistances) return;
                                            let current = [
                                              ...(item.custom_condition_resistances || []),
                                            ];
                                            if (checked) current.push(res);
                                            else current = current.filter((r) => r !== res);
                                            onChangeResistances(item.id, current);
                                          }}
                                          className="text-sm focus:bg-stone-800 focus:text-stone-100 cursor-pointer"
                                        >
                                          {res}
                                        </DropdownMenuCheckboxItem>
                                      );
                                    })}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}

                            {itemType === 'Arma' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="h-5 px-1.5 bg-stone-800 rounded border border-stone-700 text-stone-400 hover:text-amber-400 transition-colors flex items-center justify-center"
                                    title="Adicionar Efeito de Arma (Natural 18+)"
                                  >
                                    <Zap className="w-3 h-3" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  className="w-56 bg-stone-900 border-stone-800 text-stone-200"
                                  align="start"
                                >
                                  <div className="px-2 py-1.5 text-xs font-semibold text-amber-500/80">
                                    Efeitos Ofensivos (Nat 18+)
                                  </div>
                                  {Object.values(CONDITIONS).map((cond) => {
                                    const isChecked = (item.weapon_effects || []).some(
                                      (e: WeaponEffect) => e.conditionId === cond.id,
                                    );
                                    return (
                                      <DropdownMenuCheckboxItem
                                        key={cond.id}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          if (!onChangeWeaponEffects) return;
                                          let current = [...(item.weapon_effects || [])];
                                          if (checked) {
                                            current.push({
                                              conditionId: cond.id,
                                              trigger: 'natural_18_plus',
                                            });
                                          } else {
                                            current = current.filter(
                                              (e: WeaponEffect) => e.conditionId !== cond.id,
                                            );
                                          }
                                          onChangeWeaponEffects(item.id, current);
                                        }}
                                        className="text-sm focus:bg-stone-800 focus:text-stone-100 cursor-pointer"
                                      >
                                        {cond.name}
                                      </DropdownMenuCheckboxItem>
                                    );
                                  })}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}

                            {itemType === 'Consumível' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="h-5 px-1.5 bg-stone-800 rounded border border-stone-700 text-stone-400 hover:text-green-400 transition-colors flex items-center justify-center"
                                    title="Adicionar Cargas"
                                  >
                                    <Target className="w-3 h-3" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  className="w-40 bg-stone-900 border-stone-800 text-stone-200"
                                  align="start"
                                >
                                  <div className="px-2 py-1.5 text-xs font-semibold text-green-500/80">
                                    Adicionar Cargas
                                  </div>
                                  <DropdownMenuCheckboxItem
                                    checked={false}
                                    onCheckedChange={() => onAddCharges && onAddCharges(item.id, 1)}
                                    className="text-sm focus:bg-stone-800 focus:text-stone-100 cursor-pointer"
                                  >
                                    +1 Unidade
                                  </DropdownMenuCheckboxItem>
                                  <DropdownMenuCheckboxItem
                                    checked={false}
                                    onCheckedChange={() => onAddCharges && onAddCharges(item.id, 5)}
                                    className="text-sm focus:bg-stone-800 focus:text-stone-100 cursor-pointer"
                                  >
                                    +5 Unidades
                                  </DropdownMenuCheckboxItem>
                                  <DropdownMenuCheckboxItem
                                    checked={false}
                                    onCheckedChange={() =>
                                      onAddCharges && onAddCharges(item.id, 10)
                                    }
                                    className="text-sm focus:bg-stone-800 focus:text-stone-100 cursor-pointer"
                                  >
                                    +10 Unidades
                                  </DropdownMenuCheckboxItem>
                                  <DropdownMenuCheckboxItem
                                    checked={false}
                                    onCheckedChange={() =>
                                      onAddCharges && onAddCharges(item.id, 20)
                                    }
                                    className="text-sm focus:bg-stone-800 focus:text-stone-100 cursor-pointer"
                                  >
                                    +20 Unidades
                                  </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </>
                        ) : (
                          item.level > 1 && (
                            <span
                              className="text-[10px] bg-amber-900/80 text-amber-200 px-1 rounded font-bold leading-none"
                              title={`Nível ${item.level}`}
                            >
                              Nv.{item.level}
                            </span>
                          )
                        )}
                        {item.quantity > 1 && (
                          <span className="text-xs px-1.5 py-0.5 bg-stone-800 rounded-md text-stone-400 font-mono">
                            x{item.quantity}
                          </span>
                        )}
                        {isEquipped && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-900/40 text-amber-400 rounded border border-amber-900/50">
                            Equipado {equippedCount > 1 ? `(x${equippedCount})` : ''}
                          </span>
                        )}
                        {normalizedEffects.heal_dice && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded border border-green-900/50 flex items-center gap-1 font-bold"
                            title="Cura Variável"
                          >
                            ❤️ {normalizedEffects.heal_dice}
                          </span>
                        )}
                        {!normalizedEffects.heal_dice && normalizedEffects.heal && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded border border-green-900/50 flex items-center gap-1 font-bold"
                            title="Cura Fixa"
                          >
                            ❤️ {normalizedEffects.heal} PV
                          </span>
                        )}
                      </div>
                      {item.items?.description && (
                        <span className="text-xs text-stone-500 block mt-1">
                          {item.items.description}
                        </span>
                      )}
                      {displayDamage && (
                        <span className="text-xs text-amber-500 font-bold block mt-1">
                          Dano: {displayDamage}
                        </span>
                      )}
                      {(() => {
                        const armorClass = formatItemArmorClass({
                          slug: item.items?.slug,
                          level: item.level,
                        });
                        return armorClass ? (
                          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded border border-blue-900/50 font-bold">
                            {armorClass}
                          </span>
                        ) : null;
                      })()}
                      <ItemResistances slug={item.items?.slug} />
                      {item.custom_condition_resistances &&
                        item.custom_condition_resistances.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.custom_condition_resistances.map((res: string) => (
                              <span
                                key={res}
                                className="text-[10px] px-1.5 py-0.5 bg-indigo-900/40 text-indigo-300 rounded border border-indigo-900/50"
                              >
                                Resiste: {res}
                              </span>
                            ))}
                          </div>
                        )}
                      {item.weapon_effects && item.weapon_effects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.weapon_effects.map((effect: WeaponEffect) => {
                            const cond = CONDITIONS[effect.conditionId as keyof typeof CONDITIONS];
                            return (
                              <span
                                key={effect.conditionId}
                                className="text-[10px] px-1.5 py-0.5 bg-amber-900/40 text-amber-300 rounded border border-amber-900/50 flex items-center gap-1"
                                title="Aplicado em Natural 18+"
                              >
                                <Zap className="w-2.5 h-2.5" />
                                {cond?.name || effect.conditionId}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 sm:mt-0">
                      {item.items?.is_consumable && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-amber-900/20 text-amber-400 rounded border border-amber-900/30">
                            Consumível
                          </span>

                          {item.items?.name?.includes('Flecha') ||
                          item.items?.name?.includes('Pedra') ? (
                            <>
                              <button
                                onClick={() => onConsumeAmmunition && onConsumeAmmunition(item.id)}
                                disabled={isUpdating || item.quantity <= 0}
                                className="text-xs px-2 py-1 bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold rounded shadow-sm disabled:opacity-50 transition-colors"
                              >
                                Gastar 1
                              </button>
                              {item.items?.name?.includes('Flecha') &&
                                item.quantity < 20 &&
                                item.quantity > 0 && (
                                  <button
                                    onClick={() =>
                                      onRecoverAmmunition &&
                                      onRecoverAmmunition(item.id, 20 - item.quantity, 20)
                                    }
                                    disabled={isUpdating}
                                    className="text-xs px-2 py-1 bg-green-700 hover:bg-green-600 text-stone-200 font-bold rounded shadow-sm disabled:opacity-50 transition-colors"
                                  >
                                    Recuperar
                                  </button>
                                )}
                              {item.quantity <= 0 && (
                                <button
                                  onClick={() => onRemoveItem && onRemoveItem(item.id)}
                                  disabled={isUpdating}
                                  className="text-xs px-2 py-1 bg-red-900/50 hover:bg-red-800 text-red-200 font-bold rounded shadow-sm disabled:opacity-50 transition-colors"
                                >
                                  Descartar
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              onClick={() =>
                                onUseConsumable({
                                  ...item,
                                  items: { ...item.items, effects: normalizedEffects },
                                })
                              }
                              disabled={isUpdating || item.quantity <= 0}
                              className="text-xs px-2 py-1 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold rounded shadow-sm disabled:opacity-50 transition-colors"
                            >
                              Usar
                            </button>
                          )}
                        </div>
                      )}

                      {isEquippable && !fullyEquipped && (
                        <div className="flex items-center gap-2">
                          {normalizedEffects.slot === '1h' ? (
                            <>
                              {equipment?.mainHand !== item.id && (
                                <button
                                  onClick={() => onEquip(item.id, normalizedEffects, 'mainHand')}
                                  disabled={isUpdating}
                                  className="text-[10px] px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded border border-stone-700 transition-colors disabled:opacity-50"
                                >
                                  Mão Principal
                                </button>
                              )}
                              {equipment?.offHand !== item.id && (
                                <button
                                  onClick={() => onEquip(item.id, normalizedEffects, 'offHand')}
                                  disabled={isUpdating}
                                  className="text-[10px] px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded border border-stone-700 transition-colors disabled:opacity-50"
                                >
                                  Mão Secundária
                                </button>
                              )}
                              {normalizedEffects.properties?.includes('versatile') &&
                                equipment?.mainHand !== item.id &&
                                equipment?.offHand !== item.id && (
                                  <button
                                    onClick={() =>
                                      onEquip(item.id, { ...normalizedEffects, slot: '2h' })
                                    }
                                    disabled={isUpdating}
                                    className="text-[10px] px-2 py-1 bg-amber-900/60 hover:bg-amber-800/80 text-amber-300 font-bold rounded border border-amber-800/50 transition-colors disabled:opacity-50"
                                  >
                                    Duas Mãos
                                  </button>
                                )}
                            </>
                          ) : (
                            <button
                              onClick={() => onEquip(item.id, normalizedEffects)}
                              disabled={isUpdating}
                              title={equipTitle(item.items?.slug)}
                              className="text-xs px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded border border-stone-700 transition-colors disabled:opacity-50"
                            >
                              Equipar
                            </button>
                          )}
                        </div>
                      )}

                      {item.items?.weight > 0 && (
                        <span className="text-xs text-stone-500">{item.items.weight} kg</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
