import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Character } from '@/features/character-management/types';
import { Shield, Coins, Heart, Star, Sparkles, Activity, Zap } from 'lucide-react';
import { NPCInventoryManager } from './NPCInventoryManager';
import { useUpdateNPCInventory } from '@/hooks/useUpdateNPCInventory';
import { EquipmentSlots } from '../inventory/EquipmentSlots';
import { InventoryList } from '../inventory/InventoryList';
import { updateCharacterEquipment } from '@/lib/supabase';
import { equipItem, unequipSlot } from '@/lib/equipmentUtils';
import { getCombatStats } from '@/lib/equipmentUtils';
import { calculateModifier, calculateProficiency, formatModifier } from '@/features/character-management/utils/characterMath';
import { getTribeSkills } from '@/data/tribeSkills';
import { CharacterAvatar } from '../ui/CharacterAvatar';

interface CharacterSheetViewProps {
  userId?: string;
  sessionId?: string;
  characterId?: string;
  isGM?: boolean;
}

export function CharacterSheetView({ userId, sessionId, characterId, isGM }: CharacterSheetViewProps) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { useItem, isUpdating } = useUpdateNPCInventory();
  const [isEquipping, setIsEquipping] = useState(false);

  const handleEquip = async (characterItemId: string, itemEffects: any, targetHand?: 'mainHand' | 'offHand') => {
    if (!character) return;
    setIsEquipping(true);
    try {
      const currentEquipment = character.equipment || { head: null, body: null, mainHand: null, offHand: null };
      const newEquipment = equipItem(characterItemId, itemEffects, currentEquipment, targetHand);
      await updateCharacterEquipment(character.id, newEquipment);
      setCharacter({ ...character, equipment: newEquipment });
    } catch (err) {
      console.error('Error equipping item:', err);
      // Optional: add a toast or error state here
    } finally {
      setIsEquipping(false);
    }
  };

  const handleUnequip = async (slot: 'head' | 'body' | 'mainHand' | 'offHand') => {
    if (!character) return;
    setIsEquipping(true);
    try {
      const currentEquipment = character.equipment || { head: null, body: null, mainHand: null, offHand: null };
      const newEquipment = unequipSlot(slot, currentEquipment);
      await updateCharacterEquipment(character.id, newEquipment);
      setCharacter({ ...character, equipment: newEquipment });
    } catch (err) {
      console.error('Error unequipping item:', err);
    } finally {
      setIsEquipping(false);
    }
  };

  const handleUpdateItemLevel = async (characterItemId: string, newLevel: number) => {
    setIsEquipping(true);
    try {
      const { error } = await supabase
        .from('character_items')
        .update({ level: newLevel })
        .eq('id', characterItemId);
      if (error) throw error;
      // Realtime listener will automatically pick up the change and update state
    } catch (err) {
      console.error('Error updating item level:', err);
    } finally {
      setIsEquipping(false);
    }
  };

  useEffect(() => {
    async function fetchCharacter() {
      setIsLoading(true);
      setError(null);
      try {
        let characterIdToFetch: string | null = characterId || null;

        // Try to find the assigned character for this session if characterId is not provided
        if (!characterIdToFetch && sessionId && userId) {
          const { data: participantData } = await supabase
            .from('session_participants')
            .select('character_id')
            .eq('session_id', sessionId)
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle();

          if (participantData?.character_id) {
            characterIdToFetch = participantData.character_id;
          }
        }

        let charData = null;
        let charError = null;

        if (characterIdToFetch) {
          // Fetch the specific assigned character
          const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('id', characterIdToFetch)
            .single();
          charData = data;
          charError = error;
        } else if (userId) {
          // Fallback to the latest character if not explicitly assigned
          const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          charData = data;
          charError = error;
        } else {
          charError = { message: 'Identificador de personagem ou jogador não fornecido.' };
        }

        if (charError) {
          if (charError.code === 'PGRST116') {
            setError('Personagem não encontrado para este jogador.');
          } else {
            throw charError;
          }
        } else if (charData) {
          setCharacter(charData as unknown as Character);

          // Fetch inventory items
          const { data: itemsData, error: itemsError } = await supabase
            .from('character_items')
            .select(`
              id,
              quantity,
              level,
              items (
                id,
                name,
                description,
                category,
                is_consumable,
                requires_target,
                weight,
                effects
              )
            `)
            .eq('character_id', charData.id);

          if (!itemsError && itemsData) {
            setInventoryItems(itemsData);
          }
        }
      } catch (err: any) {
        console.error('Error fetching character:', err);
        setError(`Ocorreu um erro ao carregar a ficha. Detalhes: ${err?.message || JSON.stringify(err)}`);
      } finally {
        setIsLoading(false);
      }
    }

    if (userId || characterId) {
      fetchCharacter();
    }
  }, [userId, characterId, sessionId]);

  // Realtime updates for inventory and character stats
  useEffect(() => {
    if (!character?.id) return;

    const channel = supabase
      .channel(`character_sheet_updates_${character.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'character_items', filter: `character_id=eq.${character.id}` },
        async () => {
          // Refetch inventory items
          const { data: itemsData } = await supabase
            .from('character_items')
            .select(`
              id,
              quantity,
              level,
              items (
                id,
                name,
                description,
                category,
                is_consumable,
                requires_target,
                weight,
                effects
              )
            `)
            .eq('character_id', character.id);

          if (itemsData) {
            setInventoryItems(itemsData);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'characters', filter: `id=eq.${character.id}` },
        (payload) => {
          // Atualiza a ficha local com as novas alterações do banco
          setCharacter((prev) => prev ? { ...prev, ...payload.new } as Character : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [character?.id]);

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

  // Calculate dynamic AC using getCombatStats to properly include item level bonuses
  const { totalAc, baseAc, bonusAc } = getCombatStats({
    ...character,
    character_items: inventoryItems,
  });

  return (
    <div className="flex flex-col bg-stone-950 text-stone-200 overflow-y-auto custom-scrollbar">
      {/* Header Profile */}
      <div className="relative p-6 border-b border-stone-800 bg-gradient-to-b from-stone-900 to-stone-950 flex gap-6 items-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -z-10"></div>
        
        <CharacterAvatar 
          imageUrl={narrative?.imageUrl} 
          name={name || 'Desconhecido'} 
          className="w-24 h-24 border-4 border-stone-800 shadow-xl" 
        />
        
        <div className="flex-1">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 mb-2">
            {name || 'Desconhecido'}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-400">
          <span className="px-2 py-1 rounded-md bg-stone-800 border border-stone-700 shadow-sm">
            Tribo: <span className="text-stone-200 font-medium">{tribe || 'Nenhuma'}</span>
          </span>
          <span className="px-2 py-1 rounded-md bg-stone-800 border border-stone-700 shadow-sm">
            Vocação: <span className="text-stone-200 font-medium">{vocation || 'Nenhuma'}</span>
          </span>
          <span className="px-2 py-1 rounded-md bg-stone-800 border border-stone-700 shadow-sm flex items-center gap-1">
            <Zap className="w-3 h-3 text-blue-400" />
            Proficiência: <span className="text-stone-200 font-medium">+{calculateProficiency(1)}</span>
          </span>
        </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Vitals / Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col items-center justify-center p-4 bg-stone-900 border border-stone-800 rounded-xl shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors"></div>
            <Heart className="w-8 h-8 text-red-500 mb-2" />
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-stone-100">{stats?.current_pv ?? stats?.pv ?? 10}</span>
              <span className="text-sm text-stone-500 font-medium">/{stats?.pv ?? 10}</span>
            </div>
            <span className="text-xs text-stone-400 uppercase tracking-wider font-semibold mt-1">PV</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-stone-900 border border-stone-800 rounded-xl shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-stone-500/5 group-hover:bg-stone-500/10 transition-colors"></div>
            <Shield className="w-8 h-8 text-stone-400 mb-2" />
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-stone-100">{totalAc}</span>
              {bonusAc > 0 && (
                <span className="text-sm text-blue-400 font-medium" title={`Base ${baseAc} + Bônus ${bonusAc}`}>(+{bonusAc})</span>
              )}
            </div>
            <span className="text-xs text-stone-400 uppercase tracking-wider font-semibold mt-1">CA</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-stone-900 border border-amber-900/50 rounded-xl shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors"></div>
            <Sparkles className="w-8 h-8 text-amber-500 mb-2" />
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-amber-100">{stats?.current_faith ?? stats?.faith ?? 0}</span>
              <span className="text-sm text-amber-500/50 font-medium">/100</span>
            </div>
            <span className="text-xs text-amber-500/70 uppercase tracking-wider font-semibold mt-1">Fé</span>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-stone-900 border border-yellow-900/50 rounded-xl shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors"></div>
            <Coins className="w-8 h-8 text-yellow-500 mb-2" />
            <span className="text-3xl font-bold text-yellow-100">{character.coins ?? 0}</span>
            <span className="text-xs text-yellow-500/70 uppercase tracking-wider font-semibold mt-1">SP</span>
          </div>
        </div>

        {/* Attributes */}
        <div>
          <h3 className="text-lg font-semibold text-stone-300 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
            <Activity className="w-5 h-5 text-amber-500" />
            Atributos
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: 'FOR', value: attributes?.for },
              { label: 'DES', value: attributes?.des },
              { label: 'CON', value: attributes?.con },
              { label: 'INT', value: attributes?.int },
              { label: 'SAB', value: attributes?.sab },
              { label: 'CAR', value: attributes?.car },
            ].map((attr) => (
              <div key={attr.label} className="bg-stone-900 border border-stone-800 rounded-lg p-3 text-center flex flex-col items-center relative">
                <span className="text-stone-500 text-xs font-bold mb-1">{attr.label}</span>
                <span className="text-2xl font-bold text-stone-100">
                  {formatModifier(calculateModifier(attr.value))}
                </span>
                <span className="text-[10px] text-stone-500 font-mono mt-1 px-1.5 py-0.5 bg-stone-800 rounded">
                  {attr.value ?? 10}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Habilidades Raciais */}
        {tribe && getTribeSkills(tribe).length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-stone-300 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Habilidades de Tribo
            </h3>
            <div className="space-y-3">
              {getTribeSkills(tribe).map((skill, index) => (
                <div key={index} className="bg-stone-900 border border-stone-800 rounded-lg p-4 shadow-sm">
                  <h4 className="text-md font-bold text-amber-500 mb-1">{skill.name}</h4>
                  <p className="text-sm text-stone-400 leading-relaxed">{skill.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Narrative / Description */}
        {narrative && (narrative.history || narrative.physicalDesc || narrative.personality) && (
          <div>
            <h3 className="text-lg font-semibold text-stone-300 mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
              <Star className="w-5 h-5 text-amber-500" />
              Características
            </h3>
            <div className="space-y-4 bg-stone-900/50 p-4 rounded-xl border border-stone-800/50">
              {narrative.physicalDesc && (
                <div>
                  <h4 className="text-sm font-semibold text-stone-400 mb-1">Aparência</h4>
                  <p className="text-sm text-stone-300 leading-relaxed">{narrative.physicalDesc}</p>
                </div>
              )}
              {narrative.personality && (
                <div>
                  <h4 className="text-sm font-semibold text-stone-400 mb-1">Personalidade</h4>
                  <p className="text-sm text-stone-300 leading-relaxed">{narrative.personality}</p>
                </div>
              )}
              {narrative.history && (
                <div>
                  <h4 className="text-sm font-semibold text-stone-400 mb-1">História</h4>
                  <p className="text-sm text-stone-300 leading-relaxed">{narrative.history}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Equipment & Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <EquipmentSlots 
              equipment={character.equipment || { head: null, body: null, mainHand: null, offHand: null }} 
              inventoryItems={inventoryItems} 
              characterVocation={vocation}
              onUnequip={handleUnequip} 
            />
          </div>
          <div className="lg:col-span-2">
            <InventoryList
              inventoryItems={inventoryItems}
              equipment={character.equipment || { head: null, body: null, mainHand: null, offHand: null }}
              onEquip={handleEquip}
              onUseConsumable={(item) => useItem(character!.id, item.id, item.quantity, item.items.effects, character!.stats, !(character!.is_npc))}
              isUpdating={isUpdating || isEquipping}
              isGM={isGM}
              onChangeLevel={handleUpdateItemLevel}
            />
          </div>
        </div>

          {isGM && character?.id && (
            <div className="mt-8 pt-6 border-t border-stone-800">
              <NPCInventoryManager characterId={character.id} items={inventoryItems} />
            </div>
          )}
        </div>
    </div>
  );
}
