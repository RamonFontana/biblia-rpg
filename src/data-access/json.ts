import type { Json } from '@/types/database.types';

/** Valor `jsonb` a partir de um tipo do app (interfaces não são atribuíveis a `Json`). */
export function toJson(value: unknown): Json {
  return value as Json;
}
