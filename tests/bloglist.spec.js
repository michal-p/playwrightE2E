const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith, createBlog } = require('./helper')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    // empty the db: user and blogs
    await request.post('/api/testing/reset')
    // create a user for the backend here
    await request.post('/api/users', {
      data: {
        name: 'mario',
        username: 'super',
        password: 'Kukolainen#2'
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
      await loginWith(page, 'super', 'Kukolainen#2')
      await expect(page.getByText('logged-in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await loginWith(page, 'super', 'wrong password')
      await expect(page.getByText('logged-in')).not.toBeVisible()
    })
  })

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'super', 'Kukolainen#2')
    })

    test('a new blog can be created', async ({ page }) => {
      await createBlog(page, { title: 'title c', author: 'bubu', url: 'www.bubu.com' })
      await expect(page.getByText('title cbubuview')).toBeVisible()
    })
  })
})