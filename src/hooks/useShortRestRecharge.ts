import { useEffect, useRef } from 'react';
import { markShortRestRecharge } from '@/data-access/characters';
import type { CharacterSkills } from '@/features/character-creation/types';
import { shouldRechargeForShortRest } from '@/domain/shortRest';
import { calculateRechargedAbilities } from '@/utils/abilityUtils';

/** O que a recarga lê de uma ficha. */
export interface RechargeTarget {
  id: string;
  skills?: unknown;
  last_short_rest_recharge?: string | null;
}

/**
 * Recarrega, uma vez por Descanso Curto, as Habilidades de cada ficha da lista (ADR 0006): o
 * jogador passa a própria ficha e o Mestre os NPCs jogáveis. Quem abre o app com o descanso já
 * aberto também recarrega. `onRecharged` recebe o que mudou na ficha, para a tela acompanhar.
 */
export function useShortRestRecharge(
  openRestId: string | null | undefined,
  targets: RechargeTarget[],
  onRecharged: (characterId: string, patch: Record<string, unknown>) => void,
) {
  const handled = useRef(new Set<string>());
  const notify = useRef(onRecharged);
  useEffect(() => {
    notify.current = onRecharged;
  });

  useEffect(() => {
    if (!openRestId) return;
    for (const target of targets) {
      const key = `${target.id}:${openRestId}`;
      if (handled.current.has(key)) continue;
      if (!shouldRechargeForShortRest(openRestId, target.last_short_rest_recharge)) continue;
      handled.current.add(key);

      const current = (target.skills || {}) as CharacterSkills;
      const skills = {
        ...current,
        ability_uses: calculateRechargedAbilities(current.ability_uses || {}, 'short_rest'),
      };
      markShortRestRecharge(target.id, skills, openRestId)
        .then(() => notify.current(target.id, { skills, last_short_rest_recharge: openRestId }))
        .catch((e) => {
          console.error('Erro ao recarregar as Habilidades do Descanso Curto:', e);
          handled.current.delete(key);
        });
    }
  }, [openRestId, targets]);
}
