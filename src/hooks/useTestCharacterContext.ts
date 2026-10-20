import { useEffect, useState } from 'react';
import { getCharacterTestContext, type CharacterTestContext } from '@/data-access/characters';
import { getItemFaithPenalty, listCharacterItemEffects } from '@/data-access/inventory';
import { useIsMounted } from './useIsMounted';

interface ItemEffects {
  properties?: string[];
}

/**
 * Tudo que a tela do jogador precisa saber da ficha no Teste: a ficha (para os bônus), se um item
 * equipado dá Desvantagem de furtividade e a penalidade de Fé dos Itens Profanos. Relê a ficha a
 * cada novo Teste ou resultado. Se uma leitura falhar, a tela segue sem esse dado.
 */
export function useTestCharacterContext(characterId: string | undefined, refreshKey: unknown) {
  const [sheet, setSheet] = useState<CharacterTestContext | null>(null);
  const [hasStealthDisadvantage, setHasStealthDisadvantage] = useState(false);
  const [faithPenalty, setFaithPenalty] = useState(0);
  const isMounted = useIsMounted();

  useEffect(() => {
    if (!characterId) return;

    const load = async () => {
      const cData = await getCharacterTestContext(characterId).catch((error) => {
        console.error('Error reading the character for the test:', error);
        return null;
      });
      const charItems = await listCharacterItemEffects(characterId).catch((error) => {
        console.error('Error reading the character items for the test:', error);
        return null;
      });

      const effectsOf = (cItem: { items: unknown }) =>
        (cItem.items as { effects?: ItemEffects } | null)?.effects;

      let stealthDis = false;
      const penaltyF = await getItemFaithPenalty(characterId).catch(() => 0);

      if (cData && charItems) {
        const equipmentIds = Object.values(cData.equipment || {}).filter(Boolean) as string[];
        for (const cItem of charItems) {
          const effects = effectsOf(cItem) || {};
          // Check stealth disadvantage only if equipped
          if (
            equipmentIds.includes(cItem.id) &&
            effects.properties?.includes('stealth_disadvantage')
          ) {
            stealthDis = true;
          }
        }
      }

      if (isMounted.current) {
        setHasStealthDisadvantage(stealthDis);
        setFaithPenalty(penaltyF);
        setSheet(cData);
      }
    };
    load();
  }, [characterId, refreshKey, isMounted]);

  return { sheet, hasStealthDisadvantage, faithPenalty };
}
