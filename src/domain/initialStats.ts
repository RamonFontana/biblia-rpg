// CARACTERIZAÇÃO: valores iniciais do personagem, extraídos de InitialStats sem alteração.
// Decisões: ROADMAP.md, Onda 3 (passo 5): a CA de quem tem ficha é calculada por armorClass.ts a cada
// leitura; o `ca` devolvido aqui é só o valor sem armadura exibido no resumo da criação.
// Termos: CONTEXT.md (PV, Fé Inicial).
import { calculateModifier } from '@/domain/attributes';

interface AttributeScores {
  con?: number;
  des?: number;
}

/** Vocações cujo dado de vida é d10; as demais usam d8. O PV inicial usa o valor máximo do dado. */
const D10_VOCATIONS = ['Guerreiro', 'Caçador'];

export function calculateInitialStats(
  vocation: string | undefined,
  tribe: string | undefined,
  attributes: AttributeScores | undefined,
) {
  const conMod = calculateModifier(attributes?.con || 10);
  const desMod = calculateModifier(attributes?.des || 10);

  const baseHp = D10_VOCATIONS.includes(vocation || '') ? 10 : 8;

  return {
    baseHp,
    conMod,
    desMod,
    pv: baseHp + conMod,
    ca: 10 + desMod,
    faith: tribe === 'Levi' ? 60 : 50,
  };
}
