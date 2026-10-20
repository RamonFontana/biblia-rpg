import type { ConsumableEffects } from '@/domain/consumables';
import type { Character } from '@/features/character-management/types';
import type { CharacterEquipment, ItemEffects, WeaponEffect } from '@/types/combat';
import { EquipmentSlots } from '../../inventory/EquipmentSlots';
import { InventoryList } from '../../inventory/InventoryList';
import type { SheetInventoryItems } from '@/hooks/useCharacterSheet';

const EMPTY_EQUIPMENT: CharacterEquipment = {
  head: null,
  body: null,
  mainHand: null,
  offHand: null,
};

/** A linha do inventário que a lista entrega ao usar um consumível. */
export interface ConsumableItem {
  id: string;
  quantity: number;
  items: { effects: ConsumableEffects | null | undefined };
}

interface EquipmentSectionProps {
  character: Character;
  inventoryItems: SheetInventoryItems;
  isGM: boolean | undefined;
  /** Uma ação do inventário está rodando (consumir, equipar, mudar a Qualidade…). */
  isBusy: boolean;
  onEquip: (
    characterItemId: string,
    itemEffects: ItemEffects,
    targetHand?: 'mainHand' | 'offHand',
  ) => void;
  onUnequip: (slot: 'head' | 'body' | 'mainHand' | 'offHand') => void;
  onUseConsumable: (item: ConsumableItem) => void;
  onChangeLevel: (characterItemId: string, newLevel: number) => void;
  onChangeResistances: (characterItemId: string, newResistances: string[]) => void;
  onChangeWeaponEffects: (characterItemId: string, newEffects: WeaponEffect[]) => void;
  onConsumeAmmunition: (characterItemId: string) => void;
  onRecoverAmmunition: (characterItemId: string, spentAmount: number, maxCapacity: number) => void;
  onAddCharges: (characterItemId: string, amount: number) => void;
  onRemoveItem: (characterItemId: string) => void;
}

/** Os espaços de equipamento e a lista do inventário, lado a lado. */
export function EquipmentSection({
  character,
  inventoryItems,
  isGM,
  isBusy,
  onEquip,
  onUnequip,
  onUseConsumable,
  onChangeLevel,
  onChangeResistances,
  onChangeWeaponEffects,
  onConsumeAmmunition,
  onRecoverAmmunition,
  onAddCharges,
  onRemoveItem,
}: EquipmentSectionProps) {
  const { attributes, vocation } = character;
  const equipment: CharacterEquipment = character.equipment || EMPTY_EQUIPMENT;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <EquipmentSlots
          equipment={equipment}
          inventoryItems={inventoryItems}
          characterVocation={vocation}
          characterStrength={Number(attributes?.for) || null}
          onUnequip={onUnequip}
        />
      </div>
      <div className="lg:col-span-2">
        <InventoryList
          inventoryItems={inventoryItems}
          equipment={equipment}
          onEquip={onEquip}
          vocation={vocation}
          strength={Number(attributes?.for) || null}
          onUseConsumable={onUseConsumable}
          isUpdating={isBusy}
          isGM={isGM}
          onChangeLevel={onChangeLevel}
          onChangeResistances={onChangeResistances}
          onChangeWeaponEffects={onChangeWeaponEffects}
          onConsumeAmmunition={onConsumeAmmunition}
          onRecoverAmmunition={onRecoverAmmunition}
          onAddCharges={isGM ? onAddCharges : undefined}
          onRemoveItem={onRemoveItem}
        />
      </div>
    </div>
  );
}
