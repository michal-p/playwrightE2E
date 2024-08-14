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

    describe('and db contains with couple of new blogs', () => {
      beforeEach(async ({ page }) => {
        await createBlog(page, { title: 'title 1', author: 'bubu', url: 'www.bubu.com' })
        await createBlog(page, { title: 'title 2', author: 'bubu', url: 'www.bubu.com' })
        await createBlog(page, { title: 'title 3', author: 'bubu', url: 'www.bubu.com' })
        const title1 = page.locator('.blog').filter({ hasText: 'title 1' })
        await title1.locator('button:text("view")').click()
        await title1.locator('button:text("likes")').click()

        const title2 = page.locator('.blog').filter({ hasText: 'title 2' })
        await title2.locator('button:text("view")').click()
        const like2 = await title2.locator('button:text("likes")')
        await like2.click()
        await page.waitForTimeout(100)
        await like2.click()

        const title3 = page.locator('.blog').filter({ hasText: 'title 3' })
        await title3.locator('button:text("view")').click()
        const like3 = await title3.locator('button:text("likes")')
        await like3.click()
        await page.waitForTimeout(100)
        await like3.click()
        await page.waitForTimeout(100)
        await like3.click()

        await page.goto('/')
      })

      // Test ověřující, že se na stránce nacházejí blogy s názvy 'title 1', 'title 2' a 'title 3' ve správném pořadí
      test('should find blogs title1, title2 and title3 in correct order', async ({ page }) => {
        // Čeká, až se text 'logged-in' stane viditelným
        await page.getByText('logged-in').waitFor({ state: 'visible' })

        // Vytvoření lokátorů pro jednotlivé blogy
        const blog1 = page.locator('.blog').filter({ hasText: 'title 1' })
        const blog2 = page.locator('.blog').filter({ hasText: 'title 2' })
        const blog3 = page.locator('.blog').filter({ hasText: 'title 3' })

        // Ověření, že existují přesně jeden blog pro každý název
        await expect(blog1).toHaveCount(1)
        await expect(blog2).toHaveCount(1)
        await expect(blog3).toHaveCount(1)

        // Ověření, že blogy jsou ve správném pořadí
        const blogs = await page.locator('.blog').allTextContents()
        const expectedOrder = ['title 3 bubuview', 'title 2 bubuview', 'title 1 bubuview']

        for (let i = 0; i < expectedOrder.length; i++) {
          expect(blogs[i]).toContain(expectedOrder[i])
        }
      });
    })
  })
})