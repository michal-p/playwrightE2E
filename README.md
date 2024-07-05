Inside that directory, you can run several commands:

  npx playwright test
    Runs the end-to-end tests.

  npx playwright test --ui
    Starts the interactive UI mode.

  npx playwright test --project=chromium
    Runs the tests only on Desktop Chrome.

  npx playwright test example
    Runs the tests in a specific file.

  npx playwright test --debug
    Runs the tests in debug mode.

  npx playwright codegen
    Auto generate tests with Codegen.

We suggest that you begin by typing:

    npx playwright test

And check out the following files:
  - ./tests/example.spec.js - Example end-to-end test
  - ./tests-examples/demo-todo-app.spec.js - Demo Todo App end-to-end tests
  - ./playwright.config.js - Playwright Test configuration

Visit https://playwright.dev/docs/intro for more information. ✨

DEBUG:

  npm test -- -g'importance can be changed' --debug -> run test with particular name
  await page.pause() -> break point

  Almost the same as UI mode is use of the Playwright's Trace Viewer https://playwright.dev/docs/trace-viewer-intro. The idea is that a "visual trace" of the tests is saved, which can be viewed if necessary after the tests have been completed. 
  A trace is saved by running the tests as follows: npm run test -- --trace on
  If necessary, Trace can be viewed with the command: npx playwright show-report

