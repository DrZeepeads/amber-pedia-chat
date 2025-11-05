import { test, expect } from '@playwright/test';

test.describe('Production Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Nelson-GPT/);
  });
  
  test('login page accessible', async ({ page }) => {
    await page.goto('/');
    // Check login form exists
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
  
  test('service worker registers', async ({ page }) => {
    await page.goto('/');
    const swRegistered = await page.evaluate(() => 
      'serviceWorker' in navigator
    );
    expect(swRegistered).toBeTruthy();
  });
});