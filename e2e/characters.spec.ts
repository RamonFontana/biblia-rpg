import { test, expect } from './fixtures';
import { PASSWORD, USERS } from './support/admin';
import { loginAs } from './support/ui';

test.describe('login e lista de personagens', () => {
  test('uma rota protegida sem login leva ao login', async ({ page }) => {
    await page.goto('/characters');

    await expect(page).toHaveURL('/login');
  });

  test('senha errada mostra o erro e continua no login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(USERS.player1);
    await page.getByLabel('Senha').fill(`${PASSWORD}-errada`);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('o jogador vê só os próprios personagens', async ({ page, seed }) => {
    await seed.createCharacter('player1', { name: 'Eliabe' });
    await seed.createCharacter('player2', { name: 'Rute' });

    await loginAs(page, 'player1');
    await page.getByRole('link', { name: 'Meus Personagens' }).click();

    await expect(page.getByRole('heading', { name: 'Eliabe' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Rute' })).toHaveCount(0);
  });

  test('personagem que já jogou abre a ficha; o que nunca jogou abre a edição', async ({
    page,
    seed,
  }) => {
    const veteranId = await seed.createCharacter('player1', {
      name: 'Eliabe',
      has_participated_in_session: true,
    });
    const newcomerId = await seed.createCharacter('player1', {
      name: 'Rute',
      has_participated_in_session: false,
    });

    await loginAs(page, 'player1');
    await page.goto('/characters');

    await page.getByRole('heading', { name: 'Eliabe' }).click();
    await expect(page).toHaveURL(`/characters/${veteranId}`);
    await expect(page.getByText('Tribo: Judá')).toBeVisible();
    await expect(page.getByText('Vocação: Guerreiro')).toBeVisible();
    // Guerreiro tem proficiência em Força e Constituição.
    await expect(page.getByText('MOD + PROF')).toHaveCount(2);

    await page.goto('/characters');
    await page.getByRole('heading', { name: 'Rute' }).click();
    await expect(page).toHaveURL(`/characters/${newcomerId}/edit`);
    await expect(page.getByText('Edição de Personagem')).toBeVisible();
  });
});
