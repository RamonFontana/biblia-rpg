import { expect, type Locator, type Page } from '@playwright/test';

/** O cartão de um participante no painel de combate do Mestre. */
export function participantCard(master: Page, name: string): Locator {
  return master.getByTitle(name).locator('xpath=ancestor::div[contains(@class, "bg-card")][1]');
}

/**
 * Põe o participante em foco na coluna do Mestre (tocando no Retrato dele no Palco). O cartão do
 * participante só existe na página enquanto ele está em foco; o do turno atual já vem em foco.
 */
export async function focusParticipant(master: Page, name: string) {
  // No celular o Palco é a lista de iniciativa: a linha do participante abre o cartão dele.
  const row = master.getByRole('list', { name: 'Ordem de iniciativa' }).getByRole('button', {
    name: new RegExp(`^${name},`),
  });
  if ((await row.count()) > 0) {
    if ((await row.getAttribute('aria-expanded')) === 'false') await row.click();
    await expect(master.getByTitle(name)).toBeVisible();
    return;
  }
  await master
    .getByRole('region', { name: 'Retratos' })
    .getByRole('button', { name: new RegExp(`^${name},`) })
    .click();
  await expect(master.getByTitle(name)).toBeVisible();
}

/** No celular os comandos do Mestre ficam atrás de "Comandos": abre a barra, se estiver fechada. */
export async function openCommands(master: Page) {
  const toggle = master.getByRole('button', { name: 'Comandos', exact: true });
  if ((await toggle.count()) > 0 && (await toggle.getAttribute('aria-expanded')) === 'false') {
    await toggle.click();
  }
}

/** Abre o setup, dá a iniciativa de cada participante e inicia o combate. */
export async function startCombat(
  master: Page,
  initiative: Record<string, number>,
  { timeout }: { timeout?: number } = {},
) {
  await openCommands(master);
  await master.getByRole('button', { name: 'Iniciar Combate' }).click();
  const setup = master.getByRole('dialog');
  for (const [name, value] of Object.entries(initiative)) {
    const row = setup.locator('form div.border').filter({ hasText: `${name} (` });
    await row.getByLabel('Iniciativa').fill(String(value));
  }
  await setup.getByRole('button', { name: 'Iniciar Combate' }).click();
  await expect(master.getByText('Painel de Combate (Rodada 1)')).toBeVisible({ timeout });
}

/** Aplica dano ou cura pelo botão "Modificar Vida" do cartão. */
export async function modifyHealth(
  master: Page,
  name: string,
  type: 'Dano' | 'Cura',
  amount: number,
) {
  await focusParticipant(master, name);
  await participantCard(master, name).getByRole('button', { name: 'Modificar Vida' }).click();
  const modal = master.getByRole('dialog');
  if (type === 'Cura') {
    await modal.getByRole('combobox', { name: 'Tipo' }).click();
    await master.getByRole('option', { name: 'Cura' }).click();
  }
  await modal.getByLabel('Valor').fill(String(amount));
  await modal.getByRole('button', { name: 'Aplicar' }).click();
  await expect(modal).toBeHidden();
}

/** Aplica uma Condição pelo botão "Adicionar Efeito"; duração 0 é "até ser curada". */
export async function addCondition(master: Page, name: string, condition: string, turns: number) {
  await focusParticipant(master, name);
  await participantCard(master, name).getByRole('button', { name: 'Adicionar Efeito' }).click();
  const modal = master.getByRole('dialog');
  await modal.getByRole('combobox', { name: 'Condição' }).click();
  await master.getByRole('option', { name: condition }).click();
  await modal.getByLabel('Duração (Turnos)').fill(String(turns));
  await modal.getByRole('button', { name: 'Aplicar' }).click();
  await expect(modal).toBeHidden();
}

/** O quadro "PV atual/máximo" da ficha. */
export function sheetPv(page: Page): Locator {
  return page.getByText('PV', { exact: true }).locator('xpath=ancestor::div[1]');
}
