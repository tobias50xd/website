import { test, expect } from '@playwright/test';

async function mockTurnstile(page) {
  await page.route('**/api/contact/config', route => route.fulfill({ json: { siteKey: 'test-site-key' } }));
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', route => route.fulfill({
    contentType: 'application/javascript',
    body: `window.turnstile = {
      render(selector, options) { window.challenge = options; return 'test-widget'; },
      reset() { window.resetCount = (window.resetCount || 0) + 1; }
    }; window.onContactTurnstileLoad();`,
  }));
  await page.goto('/#contact');
  await page.waitForFunction(() => window.challenge);
  await page.getByLabel('Your name', { exact: true }).fill('Visitor');
  await page.getByLabel('Your email', { exact: true }).fill('visitor@example.org');
  await page.getByLabel('Message', { exact: true }).fill('Hello Tobias!');
}

test('form requires verification, sends fields, and preserves confirmation after re-verification', async ({ page }) => {
  await mockTurnstile(page);
  const button = page.getByRole('button', { name: 'Send message' });
  await expect(button).toBeDisabled();
  await page.route('**/api/contact', async route => {
    expect(route.request().postDataJSON()).toEqual({ name: 'Visitor', email: 'visitor@example.org', message: 'Hello Tobias!', token: 'verified-token' });
    await route.fulfill({ json: { success: true } });
  });
  await page.evaluate(() => window.challenge.callback('verified-token'));
  await button.click();
  await expect(page.getByRole('status')).toHaveText('Thanks! Your message has been sent.');
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue('');
  await expect(button).toBeDisabled();
  await page.evaluate(() => window.challenge.callback('new-token'));
  await expect(page.getByRole('status')).toContainText('Your message has been sent');
});

test('failed send retains the message and requires a fresh verification', async ({ page }) => {
  await mockTurnstile(page);
  await page.route('**/api/contact', route => route.fulfill({ status: 503, json: { error: 'Please try again later.' } }));
  await page.evaluate(() => window.challenge.callback('verified-token'));
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('status')).toHaveText('Please try again later.');
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue('Hello Tobias!');
  await expect(page.getByRole('button', { name: 'Send message' })).toBeDisabled();
  expect(await page.evaluate(() => window.resetCount)).toBe(1);
});

test('missing setup disables submission with a useful fallback', async ({ page }) => {
  await page.route('**/api/contact/config', route => route.fulfill({ status: 503, json: {} }));
  await page.goto('/#contact');
  await expect(page.getByRole('status')).toContainText('reach out on LinkedIn');
  await expect(page.getByRole('button', { name: 'Send message' })).toBeDisabled();
});

test('expired or failed verification disables submission', async ({ page }) => {
  await mockTurnstile(page);
  await page.evaluate(() => { window.challenge.callback('token'); window.challenge['expired-callback'](); });
  await expect(page.getByRole('button', { name: 'Send message' })).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('expired');
  await page.evaluate(() => window.challenge['error-callback']());
  await expect(page.getByRole('status')).toContainText('reload');
});
