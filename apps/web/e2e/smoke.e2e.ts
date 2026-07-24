import { expect, test } from '@playwright/test';

const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL ?? 'owner@example.com';
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD ?? 'change_me_before_first_run';

const stamp = Date.now();
const clientName = `E2E Client ${stamp}`;
const projectName = `E2E Project ${stamp}`;

/**
 * The one smoke path (per the brief): log in → create client → create project
 * (auto Spares/Consumables) → add an entry → see it in analysis. Cleans up the
 * client and project it creates so it can run against a live instance safely.
 */
test('smoke: login → client → project → entry → analysis', async ({ page }) => {
  // Auto-accept the window.confirm() dialogs used by delete actions.
  page.on('dialog', (dialog) => dialog.accept());

  // 1. Log in.
  await page.goto('/login');
  await page.getByLabel('Email').fill(OWNER_EMAIL);
  await page.getByLabel('Password').fill(OWNER_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // 2. Create a client.
  await page.goto('/clients');
  await page.getByRole('button', { name: 'Add client' }).click();
  await page.getByLabel('Name').fill(clientName);
  await page.getByRole('button', { name: 'Create client' }).click();
  await expect(page.getByText(clientName)).toBeVisible();

  // 3. Create a project for that client (client pre-filled from its page).
  await page.getByText(clientName).click();
  await page.getByRole('button', { name: 'Add project' }).click();
  await page.getByLabel('Project name').fill(projectName);
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('heading', { name: projectName })).toBeVisible();

  // 4. The two auto-created systems are present (each rendered as a link).
  await expect(page.getByRole('link', { name: /Spares/ }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Consumables/ }).first()).toBeVisible();

  // 5. Add an entry: pick a system, choose the "Pump" item, qty + rate.
  await page.getByRole('button', { name: 'Add entry' }).click();
  const itemInput = page.getByPlaceholder('Type to search…');
  await itemInput.fill('Pump');
  await itemInput.press('Enter');
  await expect(page.getByText('Selected:')).toBeVisible();
  await page.getByLabel('Quantity').fill('2');
  await page.getByLabel('Rate (₹, optional)').fill('100');
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  // 6. The item summary now shows the item.
  await expect(page.getByRole('cell', { name: 'Pump', exact: true }).first()).toBeVisible();

  // 7. Analysis: the item shows an entry against this project.
  await page.goto('/analysis');
  const analysisInput = page.getByPlaceholder('Choose an item to analyse…');
  await analysisInput.fill('Pump');
  await analysisInput.press('Enter');
  await expect(page.getByText(projectName)).toBeVisible();

  // 8. Clean up (delete project, then client).
  await page.getByText(projectName).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);

  await page.goto('/clients');
  await page.getByText(clientName).click();
  await page.getByRole('button', { name: 'Delete client' }).click();
  await expect(page).toHaveURL(/\/clients$/);
});
