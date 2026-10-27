import { useEffect, useRef } from 'react';
import type { CombatAttack } from '@/data-access/combat';

/**
 * Escuta os ataques que chegam ao vivo (evento `combat-attack` da janela, disparado pelo armazém do
 * combate). O histórico carregado ao abrir a mesa não passa por aqui.
 */
export function useCombatAttackEvents(onAttack: (attack: CombatAttack) => void) {
  const handler = useRef(onAttack);
  useEffect(() => {
    handler.current = onAttack;
  });

  useEffect(() => {
    const listener = (e: Event) => handler.current((e as CustomEvent<CombatAttack>).detail);
    window.addEventListener('combat-attack', listener);
    return () => window.removeEventListener('combat-attack', listener);
  }, []);
}
