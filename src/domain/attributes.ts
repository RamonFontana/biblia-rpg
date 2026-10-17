// Modificador de atributo e bônus de proficiência (tabela 5e), que antes viviam em characterMath.
// Termos: CONTEXT.md (Teste, Vocação).

export function calculateModifier(attributeValue: number | undefined | null): number {
  if (attributeValue === undefined || attributeValue === null) return 0;
  return Math.floor((attributeValue - 10) / 2);
}

export function calculateProficiency(level: number = 1): number {
  return Math.max(2, Math.floor((level - 1) / 4) + 2);
}
