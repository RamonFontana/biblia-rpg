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
