import { adminClient } from './support/admin';
import { modifyHealth, startCombat } from './support/combat';
import { test, expect, type Seed, type SignIn } from './fixtures';
import { watchPlayers } from './support/ui';

const LEGION = 'Legião';

/** Uma mesa com Eliabe e um Endemoniado de 8 PV e CON 16 (+3), com a Fúria Desumana. */
async function openTable(seed: Seed, signIn: SignIn, skills: unknown[]) {
  const eliabe = await seed.createCharacter('player1', { name: 'Eliabe' });
  const legion = await seed.createCharacter('master', {
    name: LEGION,
    is_enemy: true,
    tribe: 'Inimigo',
    has_participated_in_session: true,
    attributes: { for: 15, des: 12, con: 16, int: 6, sab: 10, car: 10 },
    stats: { pv: 8, current_pv: 8, ca: 12, faith: 0, current_faith: 0 },
    skills: skills as never,
  });
  const sessionId = await seed.createSession({ characters: [eliabe, legion] });
  const master = await signIn('master');
  await master.goto(`/session/${sessionId}`);
  const player = await signIn('player1');
  await player.goto(`/session/${sessionId}`);
  await watchPlayers(master, 2);
  await startCombat(master, { [LEGION]: 15, Eliabe: 10 });
  return { master, legion };
}

const participantOf = async (entityId: string) => {
  const { data } = await adminClient()
    .from('combat_participants')
    .select('hp_current, ability_state')
    .eq('entity_id', entityId)
    .single();
  return data;
};

test.describe('Fúria Desumana', () => {
  test('a 0 PV o Mestre faz o TR de CON: passa com CD 10 e fica com 1 PV; a CD seguinte é 15', async ({
    seed,
    signIn,
  }) => {
    const { master, legion } = await openTable(seed, signIn, [
      { name: 'Fúria Desumana', description: 'Sobrevive com 1 PV.' },
    ]);

    await modifyHealth(master, LEGION, 'Dano', 8);
    const prompt = master.getByRole('heading', { name: 'Fúria Desumana' });
    await expect(prompt).toBeVisible();
    await expect(master.getByText(/Legião caiu a 0 PV · TR de Constituição · CD 10/)).toBeVisible();

    // d20 7 + CON 3 = 10: alcança a CD 10.
    await master.getByLabel(`d20 de ${LEGION}`).fill('7');
    await master.getByRole('button', { name: 'Aplicar Fúria Desumana' }).click();
    await expect(master.getByText(/passou no TR de CON \(10 contra CD 10\)/)).toBeVisible();
    await expect(prompt).toHaveCount(0);
    await expect.poll(async () => (await participantOf(legion))?.hp_current).toBe(1);
    expect((await participantOf(legion))?.ability_state).toEqual({
      furia: { uses: 1, handled: false },
    });

    // De novo a 0 PV: a CD agora é 15, e d20 5 + 3 = 8 falha.
    await modifyHealth(master, LEGION, 'Dano', 1);
    await expect(master.getByText(/Legião caiu a 0 PV · TR de Constituição · CD 15/)).toBeVisible();
    await master.getByLabel(`d20 de ${LEGION}`).fill('5');
    await master.getByRole('button', { name: 'Aplicar Fúria Desumana' }).click();
    await expect(master.getByText(/falhou no TR de CON \(8 contra CD 15\)/)).toBeVisible();
    await expect(prompt).toHaveCount(0);
    await expect
      .poll(async () => (await participantOf(legion))?.ability_state)
      .toEqual({ furia: { uses: 1, handled: true } });
    expect((await participantOf(legion))?.hp_current).toBe(0);
  });

  test('o inimigo sem a Fúria cai a 0 PV sem pedido de TR', async ({ seed, signIn }) => {
    const { master } = await openTable(seed, signIn, [
      { name: 'Ataque Furtivo', description: 'Só texto.' },
    ]);

    await modifyHealth(master, LEGION, 'Dano', 8);
    await expect(master.getByText(`${LEGION} caiu a 0 PV`)).toHaveCount(0);
    await expect(master.getByRole('heading', { name: 'Fúria Desumana' })).toHaveCount(0);
  });
});
