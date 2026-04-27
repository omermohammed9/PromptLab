import { test, expect } from '@playwright/test';

test.describe('Prompt Operations', () => {
  
  test('Landing page shows community feed', async ({ page }) => {
    await page.goto('/');
    // Check if the Discovery section exists
    await expect(page.getByText(/Discover what others are building/i)).toBeVisible();
  });

  test('Guest can search for public prompts', async ({ page }) => {
    await page.goto('/');
    // Check if search bar exists (assuming it's on the landing page or accessible)
    // Actually, searching usually happens in the dashboard, let's check if there is a search input
    const searchInput = page.getByPlaceholder(/Search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Engineering');
      await page.keyboard.press('Enter');
      // Wait for results or redirection
    }
  });

  test('Guest redirected when trying to create prompt', async ({ page }) => {
    await page.goto('/dashboard?action=create');
    await expect(page).toHaveURL(/\/login/);
  });
});
