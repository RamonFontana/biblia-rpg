// "Sábio" é o mesmo ofício do Sacerdote (CONTEXT.md, Sacerdote), não uma Vocação separada.
// Regras e habilidades são escritas só para Sacerdote; tudo que consulta uma Vocação por nome
// passa por aqui.

/** Nome canônico da Vocação: "Sábio" (com ou sem acento, em qualquer caixa) vira "Sacerdote". */
export function canonicalVocation<T extends string | null | undefined>(
  vocation: T,
): T | 'Sacerdote' {
  if (typeof vocation !== 'string') return vocation;
  const plain = vocation.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return plain === 'sabio' ? 'Sacerdote' : vocation;
}
