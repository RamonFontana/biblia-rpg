// Helpers comuns das passivas do inimigo que guardam estado no `ability_state` (jsonb) do
// participante: a Fúria Desumana e o Ataque Furtivo.
const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** A lista de Habilidades da ficha (o jsonb `skills`) traz uma com esse nome, sem acento nem caixa. */
export function hasSkillNamed(skills: unknown, name: string): boolean {
  return (
    Array.isArray(skills) &&
    skills.some(
      (skill) =>
        typeof skill === 'object' &&
        skill !== null &&
        typeof (skill as { name?: unknown }).name === 'string' &&
        normalize((skill as { name: string }).name) === normalize(name),
    )
  );
}

/** O `ability_state` como objeto; qualquer outra coisa (null, lista) vira vazio. */
export function stateRecord(raw: unknown): Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw)
    ? { ...(raw as Record<string, unknown>) }
    : {};
}
