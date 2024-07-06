const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith, createBlog } = require('./helper')
const password = 'salainenQ$1'

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    // empty the db: user and blogs
    await request.post('/api/testing/reset')
    // create a user for the backend here
    await request.post('/api/users', {
      data: {
        name: 'mario',
        username: 'super',
        password: password
      }
    })

    await page.goto('/')
  })

  test('Login form is shown', async ({ page }) => {
    const loginButton = await page.getByRole('button', { name: 'login' })
    await expect(loginButton).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'super', password)
      await expect(page.getByText('logged-in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await loginWith(page, 'super', 'wrong password')
      await expect(page.getByText('logged-in')).not.toBeVisible()
    })
  })

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'super', password)
    })

    test('a new blog can be created', async ({ page }) => {
      await createBlog(page, { title: 'title c', author: 'bubu', url: 'www.bubu.com' })
      await expect(page.getByText('title c', { exact: true })).toBeVisible()
    })

    test('a created blog can be liked', async ({ page }) => {
      await createBlog(page, { title: 'title c', author: 'bubu', url: 'www.bubu.com' });
      await page.getByRole('button', { name: 'view' }).click();
      const previousLikes = parseInt(await page.locator('.likes .count').first().innerText(), 10);
      await page.getByRole('button', { name: 'likes' }).click();
      await page.getByText(previousLikes + 1).first().waitFor();
      const actualLikes = parseInt(await page.locator('.likes .count').first().innerText(), 10);
      await expect(actualLikes).toBe(previousLikes + 1);
    })
  })
})