import { test, expect } from '@playwright/test'

test.describe('User Flows - Jobs and Services', () => {
  
  test('should handle job posting flow', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to post job page
    await page.click('a[href="/post"]')
    await expect(page).toHaveURL('/post')
    
    // Should show sign in message when not authenticated
    await expect(page.locator('text=Please sign in to post a job')).toBeVisible()
    
    // Check form elements are present when signed in (mock scenario)
    await page.evaluate(() => {
      // Mock session for testing form
      window.localStorage.setItem('mock-session', JSON.stringify({
        address: '0x1234567890123456789012345678901234567890'
      }))
    })
    
    // Test form validation
    const titleInput = page.locator('input[placeholder*="Build a Base Mini App"]')
    const budgetInput = page.locator('input[placeholder*="500"]')
    const descTextarea = page.locator('textarea[placeholder*="What do you need"]')
    
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test Job Title')
      await budgetInput.fill('1000')
      await descTextarea.fill('This is a test job description')
      
      // Test that form elements work
      await expect(titleInput).toHaveValue('Test Job Title')
      await expect(budgetInput).toHaveValue('1000')
      await expect(descTextarea).toHaveValue('This is a test job description')
    }
  })

  test('should handle service posting flow', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to advertise service page
    await page.click('a[href="/advertise"]')
    await expect(page).toHaveURL('/advertise')
    
    // Should show sign in message when not authenticated
    await expect(page.locator('text=Please sign in to advertise a service')).toBeVisible()
    
    // Test form elements
    const titleInput = page.locator('input[placeholder*="Smart contract audit"]')
    const rateInput = page.locator('input[placeholder*="100/hr"]')
    const descTextarea = page.locator('textarea[placeholder*="What do you offer"]')
    
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test Service')
      await rateInput.fill('50/hr')
      await descTextarea.fill('This is a test service description')
      
      await expect(titleInput).toHaveValue('Test Service')
      await expect(rateInput).toHaveValue('50/hr')
      await expect(descTextarea).toHaveValue('This is a test service description')
    }
  })

  test('should handle skill management flow', async ({ page }) => {
    await page.goto('/profile')
    
    // Should show sign in message when not authenticated
    await expect(page.locator('text=Please sign in to manage your profile')).toBeVisible()
    
    // Test skill form when authenticated (mock scenario)
    const skillInput = page.locator('input[type="text"]').first()
    
    if (await skillInput.isVisible()) {
      await skillInput.fill('JavaScript')
      
      const addButton = page.locator('button:has-text("Add")')
      if (await addButton.isVisible()) {
        await expect(addButton).toBeEnabled()
      }
    }
  })

  test('should validate job posting API endpoint', async ({ page }) => {
    // Test API endpoint directly
    const response = await page.request.post('/api/jobs', {
      data: {
        title: 'Test Job',
        budget: '500',
        desc: 'Test description'
      }
    })
    
    // Should return 401 when not authenticated
    expect(response.status()).toBe(401)
    
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  test('should validate service posting API endpoint', async ({ page }) => {
    const response = await page.request.post('/api/services', {
      data: {
        title: 'Test Service',
        rate: '100/hr',
        desc: 'Test service description'
      }
    })
    
    // Should return 401 when not authenticated
    expect(response.status()).toBe(401)
    
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  test('should validate skill posting API endpoint', async ({ page }) => {
    const response = await page.request.post('/api/skills', {
      data: {
        name: 'React'
      }
    })
    
    // Should return 401 when not authenticated
    expect(response.status()).toBe(401)
    
    const body = await response.json()
    expect(body.error).toBe('Unauthorized')
  })

  test('should handle navigation between job and service pages', async ({ page }) => {
    await page.goto('/')
    
    // Test navigation to jobs page
    await page.click('a[href="/jobs"]')
    await expect(page).toHaveURL('/jobs')
    await expect(page.locator('h1, h2')).toContainText(['Jobs', 'Available'])
    
    // Test navigation to services page  
    await page.click('a[href="/services"]')
    await expect(page).toHaveURL('/services')
    await expect(page.locator('h1, h2')).toContainText(['Services', 'Available'])
    
    // Test navigation to skills page
    await page.click('a[href="/skills"]')
    await expect(page).toHaveURL('/skills')
    await expect(page.locator('h1, h2')).toContainText(['Skills', 'Directory'])
  })

  test('should display proper error handling', async ({ page }) => {
    // Test that pages handle missing data gracefully
    await page.goto('/jobs')
    
    // Should not crash if no jobs are available
    await expect(page.locator('body')).toBeVisible()
    
    await page.goto('/services')
    await expect(page.locator('body')).toBeVisible()
    
    await page.goto('/skills')
    await expect(page.locator('body')).toBeVisible()
  })

})
