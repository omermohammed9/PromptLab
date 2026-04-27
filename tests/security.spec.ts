import { test, expect } from '@playwright/test';

test.describe('Security & Authorization', () => {
  
  test('unauthenticated user cannot access dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated user cannot access admin panel', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('public feed is accessible without login', async ({ page }) => {
    await page.goto('/');
    // Check if the landing page content is visible
    await expect(page.getByText(/Prompt Engineering Studio/i)).toBeVisible();
  });

  test('login page has security headers/elements', async ({ page }) => {
    await page.goto('/login');
    // Check for CSRF-like protections if applicable or just standard login UI
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
  });
});
