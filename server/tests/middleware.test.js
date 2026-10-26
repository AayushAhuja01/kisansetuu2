// Run with: npm test  (no database needed)
import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret';
const { auth, allow } = await import('../middleware.js');
const fakeRes = () => { const r = { code: 200, body: null }; r.status = c => { r.code = c; return r; }; r.json = b => { r.body = b; return r; }; return r; };

test('auth rejects a missing token with 401', () => {
  const r = fakeRes(); auth({ headers: {} }, r, () => assert.fail('next should not run'));
  assert.equal(r.code, 401);
});
test('auth accepts a valid token and sets req.user', () => {
  const req = { headers: { authorization: 'Bearer ' + jwt.sign({ id: '1', role: 'farmer' }, 'test-secret') } };
  let ok = false; auth(req, fakeRes(), () => { ok = true; });
  assert.ok(ok); assert.equal(req.user.role, 'farmer');
});
test('auth rejects an expired token with 401', () => {
  const t = jwt.sign({ id: '1', role: 'farmer' }, 'test-secret', { expiresIn: -10 });
  const r = fakeRes(); auth({ headers: { authorization: 'Bearer ' + t } }, r, () => assert.fail());
  assert.equal(r.code, 401); assert.match(r.body.message, /expired/i);
});
test('allow blocks the wrong role with 403', () => {
  const r = fakeRes(); allow('admin')({ user: { role: 'buyer' } }, r, () => assert.fail());
  assert.equal(r.code, 403);
});
