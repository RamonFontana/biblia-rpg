/** Mensagem de um erro capturado (`unknown`): a do erro, ou `fallback` se não houver texto. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}
