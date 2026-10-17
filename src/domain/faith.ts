// CARACTERIZAÇÃO: comportamento atual do Teste de Fé, extraído sem alteração.
//
// Hoje a mesma decisão (passou ou não passou) é tomada em dois lugares com fórmulas diferentes:
// a tela do jogador soma a penalidade de Item Profano, o serviço que grava no banco não soma.
// Decisão (ROADMAP, Onda 2, bloco B): uma função única que considera a Fé Efetiva.
// Estas funções somem quando isso for feito.

interface FaithStats {
  current_faith?: number;
  faith?: number;
}

/**
 * Fórmula da tela do jogador (PlayerTestDialog). `difficulty` é o Modificador de Fé do Mestre:
 * positivo é Misericórdia, negativo é Punição. `itemFaithPenalty` é a soma (negativa) dos itens
 * profanos carregados.
 */
export function isFaithTestFailedOnPlayerScreen(
  rolled: number,
  difficulty: number,
  stats: FaithStats | undefined,
  itemFaithPenalty: number,
): boolean {
  let currentFaith = stats?.current_faith ?? stats?.faith ?? 0;
  currentFaith += itemFaithPenalty;
  return rolled - difficulty > currentFaith;
}

/** Fórmula do serviço que grava `is_approved` (sessionTestService.submitTestResult). */
export function isFaithTestApprovedByService(
  rolled: number,
  difficulty: number,
  stats: FaithStats,
): boolean {
  const currentFaith = stats.current_faith ?? stats.faith ?? 0;
  return rolled - difficulty <= currentFaith;
}
