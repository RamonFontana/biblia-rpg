import { adminClient } from './support/admin';
import { expect, test } from './fixtures';

const SESSION_NAME = 'Invasão a Jericó';

const stats = (current_faith: number) => ({
  pv: 11,
  current_pv: 11,
  ca: 11,
  faith: 50,
  current_faith,
});

test.describe('Estado de Fé', () => {
  test('o selo aparece na ficha do jogador e no cartão do Mestre, e segue a Fé em tempo real', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe', stats: stats(25) });
    const sessionId = await seed.createSession({ name: SESSION_NAME, characters: [eliabe] });

    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    const player = await signIn('player1');
    await player.goto(`/session/${sessionId}`);

    await expect(master.getByText('Eliabe (Nível 1)')).toBeVisible();
    await expect(master.getByText('Abalado')).toBeVisible();
    await expect(player.getByText('Abalado').first()).toBeVisible();

    const { error } = await adminClient()
      .from('characters')
      .update({ stats: stats(80) })
      .eq('id', eliabe);
    if (error) throw error;

    await expect(master.getByText('Inabalável')).toBeVisible();
    await expect(player.getByText('Inabalável').first()).toBeVisible();
    await expect(master.getByText('Abalado')).toHaveCount(0);
  });

  test('o aviso de Ruptura aparece com Fé 0, com o nome, e some quando a Fé sobe', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', { name: 'Eliabe', stats: stats(0) });
    const rute = await seed.createCharacter('player2', { name: 'Rute', stats: stats(40) });
    const sessionId = await seed.createSession({
      name: SESSION_NAME,
      characters: [eliabe, rute],
    });

    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);

    const alert = master.getByRole('alert').filter({ hasText: 'Ruptura' });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Eliabe');
    await expect(alert).not.toContainText('Rute');

    const { error } = await adminClient()
      .from('characters')
      .update({ stats: stats(3) })
      .eq('id', eliabe);
    if (error) throw error;

    await expect(alert).toHaveCount(0);
  });
});
