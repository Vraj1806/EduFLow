import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@eduflow.local');
  await page.locator('input[type="password"]').fill('rBn5u+3h0/ZfNc9d');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  await page.getByText(/welcome back/i).waitFor({ timeout: 10000 });
}

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/EduFlow/i);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /create an account/i })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(500);
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should login with valid credentials', async ({ page, context }) => {
    await page.getByLabel(/email/i).fill('admin@eduflow.local');
    await page.locator('input[type="password"]').fill('rBn5u+3h0/ZfNc9d');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 10000 });

    const cookies = await context.cookies();
    const accessToken = cookies.find((c) => c.name === 'access_token');
    const refreshToken = cookies.find((c) => c.name === 'refresh_token');
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(accessToken?.httpOnly).toBe(true);
    expect(refreshToken?.httpOnly).toBe(true);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid|incorrect|failed|wrong/i)).toBeVisible({ timeout: 5000 });
  });

  test('should persist session after page reload', async ({ page }) => {
    await page.getByLabel(/email/i).fill('admin@eduflow.local');
    await page.locator('input[type="password"]').fill('rBn5u+3h0/ZfNc9d');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await page.getByText(/welcome back/i).waitFor({ timeout: 10000 });

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('should logout successfully', async ({ page, context }) => {
    await login(page);

    const logoutButton = page.getByRole('button', { name: /logout/i });
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    await logoutButton.click();

    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');

    const cookies = await context.cookies();
    const accessToken = cookies.find((c) => c.name === 'access_token');
    const refreshToken = cookies.find((c) => c.name === 'refresh_token');
    expect(accessToken).toBeFalsy();
    expect(refreshToken).toBeFalsy();
  });

  test('should protect dashboard route when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });
});
