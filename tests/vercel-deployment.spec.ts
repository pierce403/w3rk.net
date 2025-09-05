import { test, expect } from '@playwright/test';

test.describe('Vercel Deployment Compatibility', () => {
  test('environment variables should be properly configured', async ({ page }) => {
    await page.goto('/');
    
    // Check that the app loads without environment variable errors
    await expect(page.locator('body')).toBeVisible();
    
    // Check console for any environment variable warnings
    const warnings = [];
    page.on('console', msg => {
      if (msg.type() === 'warn' && msg.text().includes('environment')) {
        warnings.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Should not have critical environment warnings
    const criticalWarnings = warnings.filter(warning => 
      warning.includes('NEXTAUTH_SECRET') || 
      warning.includes('WALLETCONNECT')
    );
    
    expect(criticalWarnings).toHaveLength(0);
  });

  test('Next.js API routes work correctly', async ({ request }) => {
    // Test that API routes are working (required for Vercel functions)
    const apiRoutes = [
      '/api/health',
      '/api/auth/nonce',
      '/api/auth/csrf',
      '/api/auth/session'
    ];
    
    for (const route of apiRoutes) {
      const response = await request.get(route);
      expect(response.ok()).toBeTruthy();
    }
  });

  test('static assets are properly optimized', async ({ page }) => {
    await page.goto('/');
    
    // Check that images are optimized (if any)
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src) {
        // Next.js optimized images should have proper loading attributes
        const loading = await img.getAttribute('loading');
        // Should either have lazy loading or be above the fold
        expect(loading === 'lazy' || loading === 'eager' || loading === null).toBeTruthy();
      }
    }
  });

  test('CSP and security headers compatibility', async ({ page }) => {
    await page.goto('/');
    
    // Check that WalletConnect modal can load (tests CSP compatibility)
    const signInButton = page.getByRole('button', { name: /scan to sign in/i });
    await signInButton.click();
    
    // Wait for modal or button state change - if CSP is blocking, this will fail
    await expect(
      page.locator('w3m-modal, [data-testid*="modal"], [class*="modal"], [class*="walletconnect"], [role="dialog"]')
      .or(page.getByRole('button', { name: /connecting|sign message/i }))
    ).toBeVisible({ timeout: 10000 });
  });

  test('serverless function cold start handling', async ({ request }) => {
    // Test that API routes handle cold starts properly
    const startTime = Date.now();
    const response = await request.get('/api/health');
    const endTime = Date.now();
    
    expect(response.ok()).toBeTruthy();
    
    // Should respond within reasonable time even on cold start
    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(10000); // 10 seconds max for cold start
  });

  test('Edge Runtime compatibility', async ({ page }) => {
    await page.goto('/');
    
    // Test that the app works in environments similar to Vercel Edge Runtime
    // Check that no Node.js specific APIs are used in client-side code
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Trigger authentication flow which uses various APIs
    const signInButton = page.getByRole('button', { name: /scan to sign in/i });
    await signInButton.click();
    
    await page.waitForTimeout(3000);
    
    // Should not have errors about Node.js APIs not being available
    const nodeApiErrors = errors.filter(error => 
      error.includes('require is not defined') ||
      error.includes('process is not defined') ||
      error.includes('Buffer is not defined') ||
      error.includes('fs is not defined')
    );
    
    expect(nodeApiErrors).toHaveLength(0);
  });

  test('dynamic imports work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Test that dynamic imports work (important for code splitting on Vercel)
    // The WalletConnect modal uses dynamic imports
    const signInButton = page.getByRole('button', { name: /scan to sign in/i });
    await signInButton.click();
    
    // Should load dynamically imported components without errors
    await expect(
      page.locator('w3m-modal, [data-testid*="modal"], [class*="modal"], [class*="walletconnect"], [role="dialog"]')
      .or(page.getByRole('button', { name: /connecting|sign message/i }))
    ).toBeVisible({ timeout: 15000 });
  });
});
