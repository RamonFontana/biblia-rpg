import { test as base, expect } from '@playwright/test';
import type { TablesInsert } from '../src/types/database.types';
import { adminClient, ensureUsers, type UserKey } from './support/admin';
import { characterRow } from './support/characters';

interface Seed {
  /** Cria uma ficha do usuário; ela é apagada no fim do teste. */
  createCharacter(owner: UserKey, overrides?: Partial<TablesInsert<'characters'>>): Promise<string>;
}

export const test = base.extend<{ seed: Seed }>({
  // `page` só obriga o `seed` a ser desmontado antes da página fechar.
  seed: async ({ page }, provide) => {
    void page;
    const admin = adminClient();
    const users = await ensureUsers();
    const characterIds: string[] = [];

    await provide({
      async createCharacter(owner, overrides) {
        const { data, error } = await admin
          .from('characters')
          .insert(characterRow(users[owner], overrides))
          .select('id')
          .single();
        if (error) throw error;
        characterIds.push(data.id);
        return data.id;
      },
    });

    if (characterIds.length > 0) {
      const { error } = await admin.from('characters').delete().in('id', characterIds);
      if (error) throw error;
    }
  },
});

export { expect };
