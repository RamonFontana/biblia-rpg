import { test as base, expect, type Page } from '@playwright/test';
import type { TablesInsert } from '../src/types/database.types';
import { adminClient, ensureUsers, type UserKey } from './support/admin';
import { characterRow } from './support/characters';
import { loginAs } from './support/ui';

interface SessionOptions {
  name?: string;
  /** Fichas já criadas por `createCharacter` que o Mestre convoca. */
  characters?: string[];
  /** Nomes dos NPCs simples da mesa (ocultos, como na criação pela tela). */
  npcs?: string[];
}

export interface Seed {
  /** Cria uma ficha do usuário. */
  createCharacter(owner: UserKey, overrides?: Partial<TablesInsert<'characters'>>): Promise<string>;
  /** Põe um item do catálogo (pelo `slug`) no inventário da ficha. */
  giveItem(characterId: string, slug: string, quantity?: number): Promise<void>;
  /** Cria um inimigo do Mestre de teste, pronto para entrar numa sessão. */
  createEnemy(
    name: string,
    stats?: { pv: number; ca: number },
    attributes?: TablesInsert<'characters'>['attributes'],
  ): Promise<string>;
  /** Cria uma sessão ativa do Mestre de teste, com os participantes e NPCs pedidos. */
  createSession(options?: SessionOptions): Promise<string>;
}

export type SignIn = (user: UserKey) => Promise<Page>;

export const test = base.extend<{ seed: Seed; signIn: SignIn }>({
  // Abre outro navegador isolado já logado como o usuário, para testes com mais de uma pessoa.
  // Os jogadores herdam o aparelho do projeto (o `mobile` simula um Pixel 7).
  signIn: async (
    { browser, baseURL, locale, viewport, userAgent, isMobile, hasTouch, deviceScaleFactor },
    provide,
  ) => {
    const contexts: { close(): Promise<void> }[] = [];
    await provide(async (user) => {
      // O Mestre fica sempre no desktop: a tela dele no celular é o ticket 11 da Onda 6.
      const device =
        user === 'master'
          ? { viewport: { width: 1280, height: 720 } }
          : { viewport, userAgent, isMobile, hasTouch, deviceScaleFactor };
      const context = await browser.newContext({ baseURL, locale, ...device });
      contexts.push(context);
      const page = await context.newPage();
      await loginAs(page, user);
      return page;
    });
    await Promise.all(contexts.map((context) => context.close()));
  },

  // `page` só obriga o `seed` a ser desmontado antes da página fechar.
  seed: async ({ page }, provide) => {
    void page;
    const admin = adminClient();
    const users = await ensureUsers();
    const ownerOf = new Map<string, string>();

    // Os usuários de teste só existem para os testes: apagar tudo que eles têm deixa a base limpa
    // também depois de uma execução interrompida e cobre o que a própria tela criou.
    const wipe = async () => {
      const owners = Object.values(users);
      const sessions = await admin.from('game_sessions').delete().eq('gm_id', users.master);
      if (sessions.error) throw sessions.error;
      const characters = await admin.from('characters').delete().in('user_id', owners);
      if (characters.error) throw characters.error;
    };

    await wipe();
    await provide({
      async createCharacter(owner, overrides) {
        const { data, error } = await admin
          .from('characters')
          .insert(characterRow(users[owner], overrides))
          .select('id')
          .single();
        if (error) throw error;
        ownerOf.set(data.id, users[owner]);
        return data.id;
      },

      async giveItem(characterId, slug, quantity = 1) {
        const item = await admin.from('items').select('id').eq('slug', slug).single();
        if (item.error) throw item.error;
        const { error } = await admin
          .from('character_items')
          .insert({ character_id: characterId, item_id: item.data.id, quantity });
        if (error) throw error;
      },

      async createEnemy(name, { pv, ca } = { pv: 12, ca: 12 }, attributes) {
        return this.createCharacter('master', {
          name,
          ...(attributes && { attributes }),
          is_enemy: true,
          tribe: 'Inimigo',
          has_participated_in_session: true,
          stats: { pv, current_pv: pv, ca, faith: 0, current_faith: 0 },
          skills: [],
        });
      },

      async createSession({ name = 'Invasão a Jericó', characters = [], npcs = [] } = {}) {
        const { data, error } = await admin
          .from('game_sessions')
          .insert({ name, gm_id: users.master, status: 'active' })
          .select('id')
          .single();
        if (error) throw error;

        if (characters.length > 0) {
          const participants = await admin.from('session_participants').insert(
            characters.map((characterId) => {
              const userId = ownerOf.get(characterId);
              if (!userId) throw new Error(`Ficha ${characterId} não foi criada por este teste.`);
              return { session_id: data.id, character_id: characterId, user_id: userId };
            }),
          );
          if (participants.error) throw participants.error;
        }

        if (npcs.length > 0) {
          const rows = npcs.map((npcName) => ({
            session_id: data.id,
            name: npcName,
            description: '',
            stats: {},
            is_visible: false,
          }));
          const inserted = await admin.from('session_npcs').insert(rows);
          if (inserted.error) throw inserted.error;
        }
        return data.id;
      },
    });
    await wipe();
  },
});

export { expect };
