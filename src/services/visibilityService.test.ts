// O Mestre oculta ou revela um Retrato. A ficha (jogador, NPC jogável, inimigo) e o NPC simples
// guardam a marca em lugares diferentes. Termos: CONTEXT.md (Oculto).
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  setCharacterVisible: vi.fn(),
  setSimpleNpcVisible: vi.fn(),
}));
vi.mock('@/data-access/characters', () => ({ setCharacterVisible: api.setCharacterVisible }));
vi.mock('@/data-access/sessions', () => ({ setSimpleNpcVisible: api.setSimpleNpcVisible }));

import { setRetratoHidden } from './visibilityService';

beforeEach(() => {
  api.setCharacterVisible.mockReset().mockResolvedValue(undefined);
  api.setSimpleNpcVisible.mockReset().mockResolvedValue(undefined);
});

describe('setRetratoHidden', () => {
  it('oculta uma ficha: is_visible falso', async () => {
    await setRetratoHidden({ kind: 'character', id: 'e1' }, true);
    expect(api.setCharacterVisible).toHaveBeenCalledWith('e1', false);
    expect(api.setSimpleNpcVisible).not.toHaveBeenCalled();
  });

  it('revela uma ficha: is_visible verdadeiro', async () => {
    await setRetratoHidden({ kind: 'character', id: 'e1' }, false);
    expect(api.setCharacterVisible).toHaveBeenCalledWith('e1', true);
  });

  it('o NPC simples vai pela tabela dele', async () => {
    await setRetratoHidden({ kind: 'npc', id: 'n1' }, true);
    expect(api.setSimpleNpcVisible).toHaveBeenCalledWith('n1', false);
    expect(api.setCharacterVisible).not.toHaveBeenCalled();
  });

  it('lança o erro de quem falhou', async () => {
    const failure = new Error('falhou');
    api.setCharacterVisible.mockRejectedValue(failure);
    await expect(setRetratoHidden({ kind: 'character', id: 'e1' }, true)).rejects.toBe(failure);
  });
});
