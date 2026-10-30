import { expect, type Page } from '@playwright/test';
import { PASSWORD, USERS, type UserKey } from './admin';

/** Entra pela tela de login e espera a página inicial. */
export async function loginAs(page: Page, user: UserKey) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(USERS[user]);
  await page.getByLabel('Senha').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('/');
}

/** Espera a página pintar o que o React renderizou depois da última resposta de rede. */
export async function nextPaint(page: Page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

/**
 * Abre um Painel da tela da sessão pelo trilho (Ficha, Inventário, Grupo, Histórico, Descanso).
 * O que mora num Painel só existe na página depois disto. Fecha com `closePanel`.
 */
export async function openPanel(page: Page, name: string) {
  await page.getByRole('navigation', { name: 'Painéis' }).getByRole('button', { name }).click();
  await expect(page.getByRole('dialog', { name })).toBeVisible();
}

export async function closePanel(page: Page) {
  await page.getByRole('dialog').getByRole('button', { name: 'Fechar' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

/** O Mestre espera `count` pessoas online (o contador mora no Painel Jogadores) e fecha o Painel. */
export async function watchPlayers(master: Page, count: number) {
  await openPanel(master, 'Jogadores');
  await expect(master.getByText(`Participantes Online (${count})`)).toBeVisible();
  await closePanel(master);
}

/** Abre o cartão de um Retrato do Palco (o nome é o do personagem, do NPC ou do inimigo). */
export async function openRetrato(page: Page, name: string) {
  await page
    .getByRole('region', { name: 'Retratos' })
    .getByRole('button', { name: new RegExp(`^${name},`) })
    .click();
  await expect(page.getByRole('dialog', { name })).toBeVisible();
}

/** Pede uma troca pelo cartão do Retrato; o Painel fecha sozinho. */
export async function negotiateWith(page: Page, name: string) {
  await openRetrato(page, name);
  await page.getByRole('dialog', { name }).getByRole('button', { name: 'Negociar' }).click();
  await expect(page.getByRole('dialog', { name })).toHaveCount(0);
}
