import { NPCInventoryManager } from './NPCInventoryManager';
import { useUpdateNPCInventory } from '@/hooks/useUpdateNPCInventory';
import { useCharacterSheet } from '@/hooks/useCharacterSheet';
import { useSheetActions } from '@/hooks/useSheetActions';
import { getCombatStats } from '@/lib/equipmentUtils';
import { CharacterSkillsList } from './CharacterSkillsList';
import { CharacterSavingThrows } from './CharacterSavingThrows';
import { SheetHeader } from './sheet/SheetHeader';
import { VitalsGrid } from './sheet/VitalsGrid';
import { AttributesGrid } from './sheet/AttributesGrid';
import { AbilitiesSection } from './sheet/AbilitiesSection';
import { NarrativeSection } from './sheet/NarrativeSection';
import { EquipmentSection } from './sheet/EquipmentSection';

interface CharacterSheetViewProps {
  userId?: string;
  sessionId?: string;
  characterId?: string;
  isGM?: boolean;
}

export function CharacterSheetView({
  userId,
  sessionId,
  characterId,
  isGM,
}: CharacterSheetViewProps) {
  const { character, setCharacter, inventoryItems, isLoading, error } = useCharacterSheet({
    userId,
    sessionId,
    characterId,
  });
  const { consumeItem, removeItem, isUpdating } = useUpdateNPCInventory();
  const actions = useSheetActions({
    character,
    setCharacter,
    isGM,
    isInventoryBusy: isUpdating,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-10 h-10 border-4 border-stone-600 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-stone-400 animate-pulse">Consultando os pergaminhos antigos...</p>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
        <h3 className="text-xl font-bold text-red-400 mb-2">Pergaminho Vazio</h3>
        <p className="text-red-300/80">{error || 'Personagem não encontrado.'}</p>
      </div>
    );
  }

  const { attributes, stats, narrative, tribe, vocation, name } = character;
  const level = character.level || 1;

  // Calculate dynamic AC using getCombatStats to properly include item level bonuses
  const {
    totalAc,
    baseAc,
    bonusAc,
    resistances = [],
    conditionResistanceLevels = {},
  } = getCombatStats({
    ...character,
    character_items: inventoryItems,
  });

  return (
    <div className="flex flex-col bg-stone-950 text-stone-200 overflow-y-auto custom-scrollbar">
      <SheetHeader
        name={name}
        tribe={tribe}
        vocation={vocation}
        level={level}
        imageUrl={narrative?.imageUrl}
      />

      <div className="p-3 sm:p-4 md:p-6 space-y-6 md:space-y-8">
        <VitalsGrid
          stats={stats}
          coins={character.coins}
          totalAc={totalAc}
          baseAc={baseAc}
          bonusAc={bonusAc}
          resistances={resistances}
          conditionResistanceLevels={conditionResistanceLevels}
        />

        <AttributesGrid attributes={attributes} />

        {/* Saving Throws */}
        <CharacterSavingThrows attributes={attributes} level={level} vocation={vocation || ''} />

        {/* Perícias */}
        <CharacterSkillsList
          attributes={attributes}
          level={level}
          proficiencies={character.proficiencies?.skill_proficiencies || []}
        />

        <AbilitiesSection
          character={character}
          isGM={isGM}
          onUse={actions.handleUseAbility}
          onRestore={actions.handleRestoreAbility}
        />

        <NarrativeSection narrative={narrative} />

        <EquipmentSection
          character={character}
          inventoryItems={inventoryItems}
          isGM={isGM}
          isBusy={isUpdating || actions.isEquipping}
          onEquip={actions.handleEquip}
          onUnequip={actions.handleUnequip}
          onUseConsumable={(item) =>
            consumeItem(
              character.id,
              item.id,
              item.quantity,
              item.items.effects,
              character.stats ?? {},
              !character.is_npc,
            )
          }
          onChangeLevel={actions.handleUpdateItemLevel}
          onChangeResistances={actions.handleUpdateItemResistances}
          onChangeWeaponEffects={actions.handleUpdateWeaponEffects}
          onConsumeAmmunition={actions.handleConsumeAmmunition}
          onRecoverAmmunition={actions.handleRecoverAmmunition}
          onAddCharges={actions.handleAddAmmunitionCharges}
          onRemoveItem={removeItem}
        />

        {isGM && character.id && (
          <div className="mt-8 pt-6 border-t border-stone-800">
            <NPCInventoryManager characterId={character.id} items={inventoryItems} />
          </div>
        )}
      </div>
    </div>
  );
}
