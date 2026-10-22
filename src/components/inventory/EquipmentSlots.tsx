import { Shield, Sword, User } from 'lucide-react';
import type { CharacterEquipment } from '@/types/combat';
import type { InventoryItem } from '@/types/inventory';
import { checkWeaponProficiency } from '@/lib/equipmentUtils';
import { ITEMS_DB } from '@/content/items';
import { formatItemArmorClass } from '@/domain/armorClass';
import { ItemResistances } from './ItemResistances';
import { EquipWarnings } from './EquipWarnings';

interface EquipmentSlotsProps {
  equipment: CharacterEquipment | null;
  inventoryItems: InventoryItem[];
  characterVocation?: string;
  characterStrength?: number | null;
  onUnequip?: (slot: keyof CharacterEquipment) => void;
}

export function EquipmentSlots({
  equipment,
  inventoryItems,
  characterVocation = '',
  characterStrength,
  onUnequip,
}: EquipmentSlotsProps) {
  // Find the actual item objects based on character_item_id
  const headItem = inventoryItems.find((i) => i.id === equipment?.head);
  const bodyItem = inventoryItems.find((i) => i.id === equipment?.body);
  const mainHandItem = inventoryItems.find((i) => i.id === equipment?.mainHand);
  const offHandItem = inventoryItems.find((i) => i.id === equipment?.offHand);

  // Check if main and off hand are the same item (2H weapon)
  const isTwoHanded = equipment?.mainHand === equipment?.offHand && equipment?.mainHand !== null;

  const isMainHandWeapon = mainHandItem?.items?.effects?.weaponCategory !== undefined;
  const isMainProficient = isMainHandWeapon
    ? checkWeaponProficiency(mainHandItem?.items, characterVocation)
    : true;

  const isOffHandWeapon = offHandItem?.items?.effects?.weaponCategory !== undefined;
  const isOffProficient = isOffHandWeapon
    ? checkWeaponProficiency(offHandItem?.items, characterVocation)
    : true;

  const renderItemStats = (item: InventoryItem) => {
    const slug = item?.items?.slug;
    let damageDie = item?.items?.effects?.damageDie;

    // Fallback if DB item doesn't have effects populated
    if (!damageDie) {
      damageDie = ITEMS_DB.find((i) => i.id === slug)?.damage;
    }

    const armorClass = formatItemArmorClass({ slug, level: item.level });
    const warnings = (
      <EquipWarnings slug={slug} vocation={characterVocation} strength={characterStrength} />
    );
    if (!damageDie && !armorClass) {
      return (
        <>
          <ItemResistances slug={slug} />
          {warnings}
        </>
      );
    }

    return (
      <>
        <div className="flex gap-2 mt-1 text-[11px] font-medium">
          {damageDie && (
            <span className="text-red-400 flex items-center gap-1">⚔️ {damageDie}</span>
          )}
          {armorClass && (
            <span className="text-stone-300 flex items-center gap-1">🛡️ {armorClass}</span>
          )}
        </div>
        <ItemResistances slug={slug} />
        {warnings}
      </>
    );
  };

  const renderItemName = (item: InventoryItem) => {
    const level = item.level || 1;
    return (
      <div className="flex items-center gap-1 justify-center flex-wrap">
        <span className="text-stone-200 font-medium text-sm text-center">{item.items.name}</span>
        {level > 1 && (
          <span
            className="text-[9px] bg-amber-900/80 text-amber-200 px-1 rounded font-bold"
            title={`Nível ${level}`}
          >
            Nv.{level}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4 border-b border-stone-800 pb-2">
        Equipamento
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Head */}
        <div className="flex flex-col items-center p-3 bg-stone-950 border border-stone-800 rounded-lg group relative">
          <span className="text-[10px] text-stone-500 font-bold uppercase absolute top-2 left-2">
            Cabeça
          </span>
          {headItem ? (
            <div className="mt-4 flex flex-col items-center">
              {renderItemName(headItem)}
              {renderItemStats(headItem)}
              {onUnequip && (
                <button
                  onClick={() => onUnequip('head')}
                  className="text-[10px] text-red-500 hover:text-red-400 mt-1"
                >
                  Remover
                </button>
              )}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center text-stone-700">
              <User className="w-6 h-6 mb-1" />
              <span className="text-xs">Vazio</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col items-center p-3 bg-stone-950 border border-stone-800 rounded-lg group relative">
          <span className="text-[10px] text-stone-500 font-bold uppercase absolute top-2 left-2">
            Corpo
          </span>
          {bodyItem ? (
            <div className="mt-4 flex flex-col items-center">
              {renderItemName(bodyItem)}
              {renderItemStats(bodyItem)}
              {onUnequip && (
                <button
                  onClick={() => onUnequip('body')}
                  className="text-[10px] text-red-500 hover:text-red-400 mt-1"
                >
                  Remover
                </button>
              )}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center text-stone-700">
              <Shield className="w-6 h-6 mb-1" />
              <span className="text-xs">Vazio</span>
            </div>
          )}
        </div>

        {/* Hands */}
        {isTwoHanded && mainHandItem ? (
          <div className="col-span-2 flex flex-col items-center p-3 bg-stone-950 border border-amber-900/30 rounded-lg group relative">
            <span className="text-[10px] text-amber-500 font-bold uppercase absolute top-2 left-2">
              Duas Mãos
            </span>
            <div className="mt-4 flex flex-col items-center">
              {renderItemName(mainHandItem)}
              {renderItemStats(mainHandItem)}
              {isMainHandWeapon && !isMainProficient && (
                <span
                  className="text-[10px] text-red-400 mt-1 font-semibold"
                  title="O personagem não tem proficiência com esta arma."
                >
                  Não Proficiente
                </span>
              )}
              {onUnequip && (
                <button
                  onClick={() => onUnequip('mainHand')}
                  className="text-[10px] text-red-500 hover:text-red-400 mt-1"
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Main Hand */}
            <div className="flex flex-col items-center p-3 bg-stone-950 border border-stone-800 rounded-lg group relative">
              <span className="text-[10px] text-stone-500 font-bold uppercase absolute top-2 left-2">
                Mão Principal
              </span>
              {mainHandItem ? (
                <div className="mt-4 flex flex-col items-center">
                  {renderItemName(mainHandItem)}
                  {renderItemStats(mainHandItem)}
                  {isMainHandWeapon && !isMainProficient && (
                    <span
                      className="text-[10px] text-red-400 mt-1 font-semibold"
                      title="O personagem não tem proficiência com esta arma."
                    >
                      Não Proficiente
                    </span>
                  )}
                  {onUnequip && (
                    <button
                      onClick={() => onUnequip('mainHand')}
                      className="text-[10px] text-red-500 hover:text-red-400 mt-1"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center text-stone-700">
                  <Sword className="w-6 h-6 mb-1" />
                  <span className="text-xs">Vazio</span>
                </div>
              )}
            </div>

            {/* Off Hand */}
            <div className="flex flex-col items-center p-3 bg-stone-950 border border-stone-800 rounded-lg group relative">
              <span className="text-[10px] text-stone-500 font-bold uppercase absolute top-2 left-2">
                Mão Secundária
              </span>
              {offHandItem ? (
                <div className="mt-4 flex flex-col items-center">
                  {renderItemName(offHandItem)}
                  {renderItemStats(offHandItem)}
                  {isOffHandWeapon && !isOffProficient && (
                    <span
                      className="text-[10px] text-red-400 mt-1 font-semibold"
                      title="O personagem não tem proficiência com esta arma."
                    >
                      Não Proficiente
                    </span>
                  )}
                  {onUnequip && (
                    <button
                      onClick={() => onUnequip('offHand')}
                      className="text-[10px] text-red-500 hover:text-red-400 mt-1"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center text-stone-700">
                  <Shield className="w-6 h-6 mb-1 opacity-50" />
                  <span className="text-xs">Vazio</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
