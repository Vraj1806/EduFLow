import { expect, test } from '@playwright/test';

const adminEmail = 'admin@eduflow.local';
const adminPassword = 'rBn5u+3h0/ZfNc9d';

test.describe('Authentication experiment', () => {
  test('supports sign-in interactions and authenticates with the existing session flow', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 350));
      await route.continue();
    });
    await page.goto('/login');

    await expect(page.getByText('Welcome back.')).toBeVisible();
    await expect(page.getByText('Secure faculty workspace')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();

    const password = page.getByRole('textbox', { name: 'Password', exact: true });
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Show password' }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Hide password' }).click();
    await expect(password).toHaveAttribute('type', 'password');

    await page.getByLabel('Email address').fill(adminEmail);
    await password.fill(adminPassword);
    await page.getByRole('checkbox', { name: 'Remember me' }).check();
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page.getByRole('button', { name: /signing in/i })).toBeVisible();

    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 10000 });
  });

  test('switches to registration and shows a password-match error without submitting', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Create an account' }).click();

    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByText('Create your account.')).toBeVisible();

    const password = page.getByRole('textbox', { name: 'Password', exact: true });
    const confirm = page.getByRole('textbox', { name: 'Confirm password', exact: true });
    await page.getByLabel('Full name').fill('Experiment Reviewer');
    await page.getByLabel('Email address').fill('reviewer@example.com');
    await password.fill('password-one');
    await confirm.fill('password-two');
    await page.getByRole('button', { name: /^create account$/i }).click();

    await expect(page.getByRole('alert')).toHaveText('Passwords do not match');
    await expect(page).toHaveURL(/\/register$/);

    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('shows an accessible API error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('invalid@example.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('wrongpassword');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 5000 });
  });

  test('keeps the experimental login usable on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login');

    await expect(page.getByText('EduFlow', { exact: true }).last()).toBeVisible();
    await expect(page.getByText('Faculty automation powered by AI.')).toBeHidden();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.screenshot({ path: '.agent/test-results/auth-experiment-mobile.png', fullPage: true });
  });

  test('keeps registration within the viewport on a tablet layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/register');

    await expect(page.getByText('Create your account.')).toBeVisible();
    await expect(page.getByLabel('Full name')).toBeVisible();
    await expect(page.getByRole('button', { name: /^create account$/i })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
    await page.screenshot({ path: '.agent/test-results/auth-experiment-tablet.png', fullPage: true });
  });
});
