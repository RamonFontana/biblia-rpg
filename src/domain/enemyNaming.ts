// A numeração dos inimigos criados em lote (CONTEXT.md: Inimigo): "Bandido do Deserto 1", "2"…
// Um inimigo sozinho e sem homônimo fica sem número; com lote ou homônimo, a contagem segue do
// maior número que a sessão já usa (um homônimo sem número conta como o 1).
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function numberEnemyNames(
  baseName: string,
  quantity: number,
  existingNames: readonly string[],
): string[] {
  const base = baseName.trim();
  const sameName = new RegExp(`^${escapeRegExp(base)}(?: (\\d+))?$`);
  const used = existingNames.flatMap((name) => {
    const match = name.trim().match(sameName);
    return match ? [match[1] ? Number(match[1]) : 1] : [];
  });

  if (quantity === 1 && used.length === 0) return [base];
  const first = used.length === 0 ? 1 : Math.max(...used) + 1;
  return Array.from({ length: quantity }, (_, i) => `${base} ${first + i}`);
}
