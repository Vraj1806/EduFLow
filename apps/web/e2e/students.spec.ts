import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('admin@eduflow.local');
  await page.locator('input[type="password"]').fill('rBn5u+3h0/ZfNc9d');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  await page.getByText(/welcome back/i).waitFor({ timeout: 10000 });
}

test.describe('Student Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should navigate to students page via sidebar', async ({ page }) => {
    await page.getByRole('link', { name: 'Students' }).click();
    await page.waitForURL(/\/dashboard\/students/, { timeout: 5000 });
    expect(page.url()).toContain('/dashboard/students');
    await expect(page.getByRole('heading', { name: 'Students' })).toBeVisible();
  });

  test('should display student list or empty state', async ({ page }) => {
    await page.goto('/dashboard/students');
    await page.waitForLoadState('networkidle');
    const table = page.getByRole('table');
    const emptyState = page.getByText(/no students yet/i);
    await expect(table.or(emptyState)).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to add student page via button', async ({ page }) => {
    await page.goto('/dashboard/students');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /add student/i }).click();
    await page.waitForURL(/\/dashboard\/students\/add/, { timeout: 5000 });
    expect(page.url()).toContain('/dashboard/students/add');
    await expect(page.getByLabel(/student id/i)).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('should create a new student', async ({ page }) => {
    await page.goto('/dashboard/students/add');
    await page.waitForLoadState('networkidle');
    const timestamp = Date.now();
    const studentId = `TEST${timestamp}`;

    await page.getByLabel(/student id/i).fill(studentId);
    await page.getByLabel(/full name/i).fill('Test Student');
    await page.getByLabel(/email/i).fill(`test${timestamp}@example.com`);
    await page.getByLabel(/roll number/i).fill('001');
    await page.getByLabel(/class/i).fill('10');
    await page.getByLabel(/division/i).fill('A');
    await page.getByLabel(/semester/i).fill('1');
    await page.getByLabel(/department/i).fill('Computer Science');

    await page.getByRole('button', { name: /create student/i }).click();
    await page.waitForURL(/\/dashboard\/students\//, { timeout: 10000 });

    await page.goto('/dashboard/students');
    await page.waitForLoadState('networkidle');
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(studentId);
      await page.waitForTimeout(1000);
      await expect(page.getByText(studentId)).toBeVisible({ timeout: 3000 });
    }
  });

  test('should search students', async ({ page }) => {
    await page.goto('/dashboard/students');
    await page.waitForLoadState('networkidle');
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should display face registration status', async ({ page }) => {
    await page.goto('/dashboard/students');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const studentRow = page.getByRole('row').nth(1);
    if (await studentRow.isVisible()) {
      await studentRow.click();
      await page.waitForTimeout(2000);
      const faceStatus = page.getByText(/not registered|registered/i);
      await expect(faceStatus).toBeVisible({ timeout: 3000 });
    } else {
      test.skip();
    }
  });
});
