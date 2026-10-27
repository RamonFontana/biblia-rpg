// CARACTERIZAÇÃO: valores iniciais do personagem, extraídos de InitialStats sem alteração.
// Decisões: ROADMAP.md, Onda 3 (passo 5): a CA de quem tem ficha é calculada por armorClass.ts a cada
// leitura; o `ca` devolvido aqui é só o valor sem armadura exibido no resumo da criação.
// Termos: CONTEXT.md (PV, Fé Inicial).
import { calculateModifier } from '@/domain/attributes';
import { getHitDie } from '@/domain/hitDice';

interface AttributeScores {
  con?: number;
  des?: number;
}

export function calculateInitialStats(
  vocation: string | undefined,
  tribe: string | undefined,
  attributes: AttributeScores | undefined,
) {
  const conMod = calculateModifier(attributes?.con || 10);
  const desMod = calculateModifier(attributes?.des || 10);

  // O PV inicial é o valor máximo do Dado de Vida da Vocação.
  const baseHp = getHitDie(vocation);

  return {
    baseHp,
    conMod,
    desMod,
    pv: baseHp + conMod,
    ca: 10 + desMod,
    faith: tribe === 'Levi' ? 60 : 50,
  };
}
