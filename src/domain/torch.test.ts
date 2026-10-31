import { describe, expect, it } from 'vitest';
import { getTorchBlock, isTorchItem, TORCH_LIGHT, torchBlockMessage, torchQuantity } from './torch';

describe('Tocha', () => {
  it('ilumina 6 m de Luz plena e mais 6 m de Penumbra', () => {
    expect(TORCH_LIGHT).toEqual({ brightM: 6, dimM: 6 });
  });

  it('reconhece a Tocha pelo slug do conteúdo', () => {
    expect(isTorchItem('tocha')).toBe(true);
    expect(isTorchItem('racao')).toBe(false);
    expect(isTorchItem(undefined)).toBe(false);
  });

  it('acende com uma Tocha no inventário, sem turno nem Pederneira', () => {
    expect(getTorchBlock({ lit: false, isDead: false, quantity: 1 })).toBeNull();
  });

  it('não acende sem Tocha, já acesa ou morto', () => {
    expect(getTorchBlock({ lit: false, isDead: false, quantity: 0 })).toBe('none');
    expect(getTorchBlock({ lit: true, isDead: false, quantity: 2 })).toBe('lit');
    expect(getTorchBlock({ lit: false, isDead: true, quantity: 2 })).toBe('dead');
    expect(torchBlockMessage('lit')).toBe('A Tocha já está acesa');
    expect(torchBlockMessage('none')).toBe('Sem Tocha no inventário');
  });

  it('soma as Tochas do inventário', () => {
    const tocha = (quantity: number) => ({ quantity, items: { slug: 'tocha' } });
    const racao = { quantity: 5, items: [{ slug: 'racao' }] };
    expect(torchQuantity([tocha(2), tocha(1), racao] as never)).toBe(3);
    expect(torchQuantity(undefined)).toBe(0);
  });
});
