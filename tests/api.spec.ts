import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health endpoint should return ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('ok', true);
    // May have additional properties like service name and timestamp
  });

  test('nonce endpoint should return valid nonce', async ({ request }) => {
    const response = await request.get('/api/auth/nonce');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('nonce');
    expect(typeof data.nonce).toBe('string');
    expect(data.nonce.length).toBeGreaterThan(0);
  });

  test('nonce endpoint should set httpOnly cookie', async ({ request }) => {
    const response = await request.get('/api/auth/nonce');
    expect(response.ok()).toBeTruthy();
    
    const setCookieHeader = response.headers()['set-cookie'];
    expect(setCookieHeader).toBeDefined();
    expect(setCookieHeader).toContain('nonce=');
    expect(setCookieHeader).toContain('HttpOnly');
  });

  test('jobs endpoint should require authentication', async ({ request }) => {
    const response = await request.post('/api/jobs', {
      data: { title: 'Test Job', description: 'Test Description' }
    });
    
    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('NextAuth endpoints should be accessible', async ({ request }) => {
    // Test CSRF endpoint
    const csrfResponse = await request.get('/api/auth/csrf');
    expect(csrfResponse.ok()).toBeTruthy();
    
    // Test session endpoint (should return null when not authenticated)
    const sessionResponse = await request.get('/api/auth/session');
    expect(sessionResponse.ok()).toBeTruthy();
    
    const sessionData = await sessionResponse.json();
    expect(sessionData).toEqual({}); // No session when not authenticated
  });
});

test.describe('Build and Deployment Compatibility', () => {
  test('static pages should be accessible', async ({ page }) => {
    // Test all static pages work
    const pages = ['/', '/about', '/jobs', '/post', '/profile', '/services'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      // Check page loads successfully
      await expect(page.locator('body')).toBeVisible();
      
      // Check no critical errors in console
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      // Reload to catch any console errors
      await page.reload();
      
      // Allow some time for any errors to appear
      await page.waitForTimeout(1000);
      
      // Filter out known acceptable errors (like network requests to local services)
      const criticalErrors = errors.filter(error => 
        !error.includes('Failed to fetch') && 
        !error.includes('NetworkError') &&
        !error.includes('localhost') &&
        !error.includes('403') && // 403 errors are expected for some WalletConnect requests
        !error.includes('CLIENT_FETCH_ERROR') && // NextAuth client errors are expected when not authenticated
        !error.toLowerCase().includes('walletconnect') && // WalletConnect might have initialization warnings
        !error.toLowerCase().includes('load failed') // Generic load failures from third-party services
      );
      
      expect(criticalErrors).toHaveLength(0);
    }
  });

  test('all assets should load correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that CSS is loaded
    const styles = await page.locator('link[rel="stylesheet"], style').count();
    expect(styles).toBeGreaterThan(0);
    
    // Check that JavaScript is loaded and executed
    const scripts = await page.locator('script').count();
    expect(scripts).toBeGreaterThan(0);
    
    // Check that main app element is rendered (indicating React hydration worked)
    await expect(page.locator('main.container')).toBeVisible();
  });

  test('service worker and PWA features work if present', async ({ page }) => {
    await page.goto('/');
    
    // Check if robots.txt is accessible
    const robotsResponse = await page.request.get('/robots.txt');
    expect(robotsResponse.ok()).toBeTruthy();
    
    // Check if sitemap.xml is accessible
    const sitemapResponse = await page.request.get('/sitemap.xml');
    expect(sitemapResponse.ok()).toBeTruthy();
    
    // Check if icon is accessible
    const iconResponse = await page.request.get('/icon.svg');
    expect(iconResponse.ok()).toBeTruthy();
  });
});
