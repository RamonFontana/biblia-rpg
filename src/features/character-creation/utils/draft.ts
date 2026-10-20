import type { DraftCharacter } from '../types';

/**
 * O rascunho sem o equipamento e as moedas: a edição não regrava a loja, e o inventário do
 * personagem é mantido pelas telas da ficha.
 */
export function withoutShop(draft: DraftCharacter): Omit<DraftCharacter, 'equipment' | 'coins'> {
  const rest = { ...draft };
  delete rest.equipment;
  delete rest.coins;
  return rest;
}
