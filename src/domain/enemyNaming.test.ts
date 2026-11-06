// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { numberEnemyNames } from './enemyNaming';

describe('numberEnemyNames', () => {
  it('um inimigo sem homônimo fica sem número', () => {
    expect(numberEnemyNames('Bandido do Deserto', 1, [])).toEqual(['Bandido do Deserto']);
    expect(numberEnemyNames('Bandido do Deserto', 1, ['Leão da Judeia'])).toEqual([
      'Bandido do Deserto',
    ]);
  });

  it('um lote numera a partir de 1', () => {
    expect(numberEnemyNames('Bandido do Deserto', 3, [])).toEqual([
      'Bandido do Deserto 1',
      'Bandido do Deserto 2',
      'Bandido do Deserto 3',
    ]);
  });

  it('continua a numeração que já existe na sessão', () => {
    expect(
      numberEnemyNames('Bandido do Deserto', 2, ['Bandido do Deserto 1', 'Bandido do Deserto 2']),
    ).toEqual(['Bandido do Deserto 3', 'Bandido do Deserto 4']);
  });

  it('um homônimo sem número conta como o primeiro', () => {
    expect(numberEnemyNames('Lobo', 1, ['Lobo'])).toEqual(['Lobo 2']);
    expect(numberEnemyNames('Lobo', 2, ['Lobo'])).toEqual(['Lobo 2', 'Lobo 3']);
  });

  it('com lacunas, segue do maior número', () => {
    expect(numberEnemyNames('Lobo', 1, ['Lobo 1', 'Lobo 4'])).toEqual(['Lobo 5']);
  });

  it('o nome com sufixo não se mistura com o nome base', () => {
    expect(numberEnemyNames('Leão', 2, ['Leão Endemoniado 1', 'Leão Endemoniado 2'])).toEqual([
      'Leão 1',
      'Leão 2',
    ]);
    expect(
      numberEnemyNames('Leão Endemoniado', 1, ['Leão 1', 'Leão 2', 'Leão Endemoniado 1']),
    ).toEqual(['Leão Endemoniado 2']);
  });

  it('o nome com símbolos de regex é tratado como texto', () => {
    expect(numberEnemyNames('Lobo (Alfa)', 2, ['Lobo (Alfa) 1'])).toEqual([
      'Lobo (Alfa) 2',
      'Lobo (Alfa) 3',
    ]);
  });

  it('ignora espaços nas pontas do nome', () => {
    expect(numberEnemyNames('  Lobo ', 2, [])).toEqual(['Lobo 1', 'Lobo 2']);
  });
});
