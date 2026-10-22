import { useEffect, useState } from 'react';
import type { Character } from '@/features/character-management/types';
import {
  findLatestCharacterOfUser,
  getCharacterById,
  subscribeToCharacterSheet,
} from '@/data-access/characters';
import { getCharacterInventory } from '@/data-access/inventory';
import type { InventoryItem } from '@/types/inventory';
import { findParticipantCharacterId } from '@/data-access/sessions';
import { getErrorMessage } from '@/lib/errorMessage';

export type SheetInventoryItems = InventoryItem[];

interface SheetSource {
  userId?: string;
  sessionId?: string;
  characterId?: string;
}

/**
 * A ficha e o inventário que a tela mostra. A ficha é a pedida por `characterId`, ou a que o
 * usuário tem na sessão, ou a mais recente dele; depois a tela acompanha as mudanças em tempo real.
 * `setCharacter` deixa a tela refletir na hora o que acabou de gravar.
 */
export function useCharacterSheet({ userId, sessionId, characterId }: SheetSource) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [inventoryItems, setInventoryItems] = useState<SheetInventoryItems>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCharacter() {
      setIsLoading(true);
      setError(null);
      try {
        let characterIdToFetch: string | null = characterId || null;

        // Try to find the assigned character for this session if characterId is not provided
        if (!characterIdToFetch && sessionId && userId) {
          characterIdToFetch = await findParticipantCharacterId(sessionId, userId);
        }

        let charData: Character | null;

        if (characterIdToFetch) {
          // Fetch the specific assigned character
          charData = await getCharacterById(characterIdToFetch);
        } else if (userId) {
          // Fallback to the latest character if not explicitly assigned
          charData = await findLatestCharacterOfUser(userId);
        } else {
          throw new Error('Identificador de personagem ou jogador não fornecido.');
        }

        if (!charData) {
          setError('Personagem não encontrado para este jogador.');
        } else {
          setCharacter(charData);

          // Fetch inventory items
          try {
            setInventoryItems(await getCharacterInventory(charData.id));
          } catch (inventoryError) {
            // Sem inventário a ficha abre assim mesmo, como antes.
            console.error('Error fetching inventory:', inventoryError);
          }
        }
      } catch (err) {
        console.error('Error fetching character:', err);
        setError(
          `Ocorreu um erro ao carregar a ficha. Detalhes: ${getErrorMessage(err, JSON.stringify(err))}`,
        );
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

    return subscribeToCharacterSheet(character.id, {
      onInventoryChange: async () => {
        // Refetch inventory items
        try {
          setInventoryItems(await getCharacterInventory(character.id));
        } catch (inventoryError) {
          // Mantém o inventário que já está na tela.
          console.error('Error fetching inventory:', inventoryError);
        }
      },
      // Atualiza a ficha local com as novas alterações do banco
      onCharacterUpdate: (row) => setCharacter((prev) => (prev ? { ...prev, ...row } : null)),
    });
  }, [character?.id]);

  return { character, setCharacter, inventoryItems, isLoading, error };
}
