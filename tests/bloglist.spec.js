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

    test('should logout', async ({ page }) => {
      await page.getByRole('button', { name: 'Logout' }).click()
      const loginButton = await page.getByRole('button', { name: 'login' })
      await expect(loginButton).toBeVisible()
    })
    
    describe('and blog is created', () => {
      beforeEach(async ({ page }) => {
        await createBlog(page, { title: 'title c', author: 'bubu', url: 'www.bubu.com' })
      })

      test('a created blog can be liked', async ({ page }) => {
        await page.getByRole('button', { name: 'view' }).click()
        const previousLikes = parseInt(await page.locator('.likes .count').first().innerText(), 10)
        await page.getByRole('button', { name: 'likes' }).click()
        await page.getByText(previousLikes + 1).first().waitFor()
        const actualLikes = parseInt(await page.locator('.likes .count').first().innerText(), 10)
        await expect(actualLikes).toBe(previousLikes + 1)
      })

      describe('and added blog from different user', () => {
        beforeEach(async ({ page, request }) => {
          //!add new User
          await request.post('/api/users', {
            data: {
              name: 'test',
              username: 'testname',
              password: password
            }
          })
          await page.getByRole('button', { name: 'Logout' }).click()
          await loginWith(page, 'testname', password)
          await createBlog(page, { title: 'title tu', author: 'tutu', url: 'www.tutu.com' })
        })

        test('only creator of blog can see that blog\'s delete button', async ({ page }) => {
          const blogContainer = page.locator('.blog').filter({ hasText: 'title tu' })
          await blogContainer.locator('button:text("view")').first().click()
          await expect(blogContainer.locator('button:text("Delete")')).toBeVisible()
          const blogContainerC = page.locator('.blog').filter({ hasText: 'title c' })
          await blogContainerC.locator('button:text("view")').first().click()
          await expect(blogContainerC.locator('button:text("Delete")')).not.toBeVisible()
        })

        test('User who added the blog can delete it', async ({ page }) => {
          const blogContainer = page.locator('.blog').filter({ hasText: 'title tu' })
          await blogContainer.locator('button:text("view")').click()
          // Handle the confirmation dialog using Playwright's dialog API
          page.on('dialog', dialog => {
            expect(dialog.message()).toContain('Remove')
            dialog.accept()
          })
          await blogContainer.locator('button:text("Delete")').click()
          // Add assertions after the dialog is accepted
          await page.locator('.notification.success').filter({ hasText: 'Deleted' }).waitFor({ state: 'visible' })
          expect(page.locator('.blog').filter({ hasText: 'title tu' })).toHaveCount(0)
        })
      })
     })
    
  })
})