import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

const payload = { name: 'Visitor', email: 'visitor@example.org', message: 'Hello Tobias!', token: 'test-token' };
function setup(t, verification = { success: true, hostname: 'portfolio.example', action: 'contact' }) {
  const send = mock.fn(async () => ({ messageId: 'test' }));
  const verify = t.mock.method(globalThis, 'fetch', async () => Response.json(verification));
  const env = {
    TURNSTILE_SITE_KEY: 'public-key', TURNSTILE_SECRET_KEY: 'private-key',
    CONTACT_FROM: 'website@portfolio.example', CONTACT_TO: 'owner@example.org',
    CONTACT_EMAIL: { send }, ASSETS: { fetch: async () => new Response('asset') },
  };
  const request = (body = payload, headers = {}) => new Request('https://portfolio.example/api/contact', {
    method: 'POST', headers: { Origin: 'https://portfolio.example', 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { env, send, verify, request };
}

test('valid submission verifies before delivery and fixes the recipient', async t => {
  const { env, send, verify, request } = setup(t);
  const response = await worker.fetch(request({ ...payload, to: 'attacker@example.org' }), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(verify.mock.callCount(), 1);
  assert.equal(send.mock.callCount(), 1);
  assert.equal(send.mock.calls[0].arguments[0].to, env.CONTACT_TO);
  assert.equal(send.mock.calls[0].arguments[0].replyTo, payload.email);
});

for (const verification of [
  { success: false },
  { success: true, hostname: 'other.example', action: 'contact' },
  { success: true, hostname: 'portfolio.example', action: 'login' },
]) {
  test(`rejects invalid verification ${JSON.stringify(verification)}`, async t => {
    const { env, send, request } = setup(t, verification);
    assert.equal((await worker.fetch(request(), env)).status, 400);
    assert.equal(send.mock.callCount(), 0);
  });
}

test('invalid input and oversized bodies never reach verification or delivery', async t => {
  const { env, send, verify, request } = setup(t);
  for (const body of [null, '{', { ...payload, token: '' }, { ...payload, email: 'bad\r\nBcc: victim@example.org' }, { ...payload, message: ' ' }, { ...payload, name: 'a'.repeat(101) }]) {
    assert.equal((await worker.fetch(request(body), env)).status, 400);
  }
  assert.equal((await worker.fetch(request('x'.repeat(32769)), env)).status, 413);
  assert.equal(verify.mock.callCount(), 0);
  assert.equal(send.mock.callCount(), 0);
});

test('rejects cross-origin and non-JSON requests', async t => {
  const { env, verify, request } = setup(t);
  assert.equal((await worker.fetch(request(payload, { Origin: 'https://other.example' }), env)).status, 403);
  assert.equal((await worker.fetch(request(payload, { 'Content-Type': 'text/plain' }), env)).status, 415);
  assert.equal(verify.mock.callCount(), 0);
});

test('configuration exposes only site key and fails closed without secrets', async t => {
  const { env, request, verify } = setup(t);
  const config = () => new Request('https://portfolio.example/api/contact/config');
  assert.deepEqual(await (await worker.fetch(config(), env)).json(), { siteKey: 'public-key' });
  delete env.TURNSTILE_SECRET_KEY;
  assert.equal((await worker.fetch(config(), env)).status, 503);
  assert.equal((await worker.fetch(request(), env)).status, 503);
  assert.equal(verify.mock.callCount(), 0);
});

test('verification outages and mail failures never report success', async t => {
  const { env, send, verify, request } = setup(t);
  verify.mock.mockImplementationOnce(async () => { throw new Error('upstream'); });
  assert.equal((await worker.fetch(request(), env)).status, 503);
  assert.equal(send.mock.callCount(), 0);
  send.mock.mockImplementation(async () => { throw new Error('private provider details'); });
  const response = await worker.fetch(request(), env);
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /private provider/);
});

test('non-API requests use static assets and contact GET cannot send', async t => {
  const { env, send } = setup(t);
  assert.equal(await (await worker.fetch(new Request('https://portfolio.example/'), env)).text(), 'asset');
  assert.equal((await worker.fetch(new Request('https://portfolio.example/api/contact'), env)).status, 405);
  assert.equal(send.mock.callCount(), 0);
});
