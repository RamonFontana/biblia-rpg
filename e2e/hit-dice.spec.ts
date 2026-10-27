import { adminClient } from './support/admin';
import { expect, test } from './fixtures';

const SESSION_NAME = 'Invasão a Jericó';

test.describe('Dados de Vida', () => {
  test('o cartão do Mestre e a ficha do jogador mostram a reserva e seguem os gastos em tempo real', async ({
    seed,
    signIn,
  }) => {
    const eliabe = await seed.createCharacter('player1', {
      name: 'Eliabe',
      vocation: 'Guerreiro',
      level: 5,
      hit_dice_spent: 2,
    });
    const rute = await seed.createCharacter('player2', {
      name: 'Rute',
      vocation: 'Batedor',
      level: 1,
    });
    const sessionId = await seed.createSession({
      name: SESSION_NAME,
      characters: [eliabe, rute],
    });

    const master = await signIn('master');
    await master.goto(`/session/${sessionId}`);
    // O cartão do Mestre lista só quem está online na mesa.
    const eliabePage = await signIn('player1');
    await eliabePage.goto(`/session/${sessionId}`);
    const rutePage = await signIn('player2');
    await rutePage.goto(`/session/${sessionId}`);

    await expect(master.getByText('Eliabe (Nível 5)')).toBeVisible();
    await expect(master.getByText('Dados de Vida 3/5 (d10)')).toBeVisible();
    await expect(master.getByText('Dados de Vida 1/1 (d8)')).toBeVisible();

    // A ficha abre noutra aba: sair da mesa tiraria o jogador da lista online do Mestre.
    const sheet = await eliabePage.context().newPage();
    await sheet.goto(`/characters/${eliabe}`);
    await expect(sheet.getByText('Dados de Vida 3/5 (d10)')).toBeVisible();

    const { error } = await adminClient()
      .from('characters')
      .update({ hit_dice_spent: 4 })
      .eq('id', eliabe);
    if (error) throw error;

    await expect(master.getByText('Dados de Vida 1/5 (d10)')).toBeVisible();
    await expect(master.getByText('Dados de Vida 3/5 (d10)')).toHaveCount(0);
    await expect(sheet.getByText('Dados de Vida 1/5 (d10)')).toBeVisible();
  });
});
