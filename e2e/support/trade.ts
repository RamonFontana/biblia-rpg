import { expect, type Locator } from '@playwright/test';

/** O lado de uma negociação (a coluna com o nome de quem oferece) dentro da janela. */
export function tradeSide(dialog: Locator, label: string): Locator {
  return dialog
    .locator('h4', { hasText: label })
    .locator('xpath=ancestor::div[contains(@class, "flex-1")][1]');
}

/** Oferece 1 unidade de um item da lista da coluna (inventário do jogador ou catálogo do Mestre). */
export async function offerItem(side: Locator, itemName: string) {
  const page = side.page();
  const row = side
    .locator('div')
    .filter({ has: page.getByText(itemName, { exact: true }) })
    .filter({ has: page.getByRole('button', { name: 'Adicionar' }) })
    .last();
  await row.getByRole('button', { name: 'Adicionar' }).click();
  await expect(side.getByText(`${itemName} × 1`)).toBeVisible();
}

/** Escreve os SP oferecidos; o valor só é gravado quando o campo perde o foco. */
export async function offerCoins(side: Locator, coins: number) {
  const input = side.locator('input[type="number"]').first();
  await input.fill(String(coins));
  await input.blur();
}

export function readyButton(side: Locator): Locator {
  return side.getByRole('button', { name: 'Pronto', exact: true });
}
