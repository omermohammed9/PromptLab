import { test, expect } from '@playwright/test';

// 1. Test Protection: User cannot go to dashboard without login
test('Guest is redirected to login', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  // Expect URL to change to /login
  await expect(page).toHaveURL(/.*login/);
});

// 2. Test Login Page UI
test('Login page loads correctly', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  
  // Check for key elements
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  await expect(page.getByPlaceholder('name@work.com')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
});

// 3. Test Public Feed (Landing Page)
test('Public feed loads for guests', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  // Check for the "Discovery" button or "PromptLab" title
  await expect(page.getByText('PromptLab')).toBeVisible();
});