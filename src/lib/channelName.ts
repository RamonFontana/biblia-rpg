/** Nome de canal único: duas assinaturas do mesmo recurso não podem dividir o canal. */
export function uniqueChannelName(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
