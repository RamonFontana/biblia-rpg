import { setCharacterVisible } from '@/data-access/characters';
import { setSimpleNpcVisible } from '@/data-access/sessions';
import type { PinTarget } from '@/data-access/mapPins';

/**
 * Oculta (`hidden` verdadeiro) ou revela um Retrato. A ficha guarda a marca em `characters.is_visible`
 * e o NPC simples, em `session_npcs.is_visible`. Termos: CONTEXT.md (Oculto).
 */
export async function setRetratoHidden(target: PinTarget, hidden: boolean): Promise<void> {
  if (target.kind === 'npc') await setSimpleNpcVisible(target.id, !hidden);
  else await setCharacterVisible(target.id, !hidden);
}
