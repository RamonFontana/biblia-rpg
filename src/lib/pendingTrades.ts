// Quais pedidos de troca esperam a resposta de quem está olhando e quais ele mesmo fez e esperam
// a dos outros. Termos: CONTEXT.md (Troca).
import type { Character } from '@/features/character-management/types';
import type { TradeWithItems } from '@/types/trade';

interface PendingTradesInput {
  activeTrades: TradeWithItems[];
  playerCharacters: { user_id: string; character: Pick<Character, 'id'> }[];
  userId: string | undefined;
  isGM: boolean;
}

export function pendingTradesOf({
  activeTrades,
  playerCharacters,
  userId,
  isGM,
}: PendingTradesInput) {
  const forUser = activeTrades.filter((t) => {
    if (t.status !== 'pending') return false;
    if (t.type === 'player_trade') {
      const target = playerCharacters.find((pc) => pc.character.id === t.target_character_id);
      return target?.user_id === userId;
    }
    // A troca com NPC é o Mestre quem aceita.
    return t.type === 'npc_trade' && isGM;
  });

  // O pedido que a própria pessoa fez e que ainda espera resposta.
  const fromUser = activeTrades.filter(
    (t) => t.status === 'pending' && !!userId && t.initiator_user_id === userId,
  );

  return { forUser, fromUser };
}
