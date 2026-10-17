// Fixa o catálogo de Condições do glossário (CONTEXT.md): nomes em português, sem Encantado,
// Amedrontado no lugar de Assustado, e Sangrando com dano no FINAL do turno (decisão do autor).
import { describe, expect, it } from 'vitest';
import { CONDITIONS } from './conditions';

describe('catálogo de Condições', () => {
  it('tem exatamente as Condições do glossário', () => {
    expect(Object.keys(CONDITIONS).sort()).toEqual([
      'agarrado',
      'amedrontado',
      'atordoado',
      'caido',
      'cego',
      'envenenado',
      'exausto',
      'impedido',
      'paralisado',
      'sangrando',
    ]);
  });

  it('o id de cada Condição é a sua chave', () => {
    for (const [key, condition] of Object.entries(CONDITIONS)) {
      expect(condition.id).toBe(key);
    }
  });

  it('Amedrontado substitui Assustado', () => {
    expect(CONDITIONS.amedrontado.name).toBe('Amedrontado');
    expect(CONDITIONS.assustado).toBeUndefined();
  });

  it('Sangrando causa dano no final do turno', () => {
    expect(CONDITIONS.sangrando.description).toContain('final de cada turno');
    expect(CONDITIONS.sangrando.description).not.toContain('início');
  });

  it('Impedido é distinto de Agarrado', () => {
    expect(CONDITIONS.impedido.description).not.toBe(CONDITIONS.agarrado.description);
  });

  it('Exausto é de nível único e sai com Descanso Longo', () => {
    expect(CONDITIONS.exausto.description).toContain('Descanso Longo');
  });
});
