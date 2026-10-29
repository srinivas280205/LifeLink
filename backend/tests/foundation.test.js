const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { socketAuth } = require('../services/socketAuth');
const { publicBroadcast } = require('../services/publicBroadcast');
const secret = 'test-only-secret';
async function authenticate(token, user = { _id: 'donor1' }) {
  const socket = { handshake: { auth: { token } }, data: {} };
  let error;
  await socketAuth({ secret, findUser: async () => user })(socket, e => { error = e; });
  return { socket, error };
}
test('valid session binds the authenticated identity', async () => {
  const result = await authenticate(jwt.sign({ userId: 'donor1' }, secret, { expiresIn: '1h' }));
  assert.equal(result.error, undefined);
  assert.equal(result.socket.data.userId, 'donor1');
});
test('rejects missing, expired, reset, banned and deleted sessions', async () => {
  for (const token of [undefined, jwt.sign({ userId: 'donor1' }, secret, { expiresIn: -1 }), jwt.sign({ userId: 'donor1', purpose: 'reset' }, secret, { expiresIn: '1h' })]) {
    assert.ok((await authenticate(token)).error);
  }
  const token = jwt.sign({ userId: 'donor1' }, secret, { expiresIn: '1h' });
  assert.ok((await authenticate(token, { _id: 'donor1', isBanned: true })).error);
  assert.ok((await authenticate(token, null)).error);
});
test('feed serialization removes contacts and GPS without changing the source', () => {
  const original = { requesterPhone: 'private', sosLocation: { lat: 1, lng: 2 }, responses: [{ donorPhone: 'private', donorName: 'Donor' }] };
  const result = publicBroadcast(original);
  assert.equal(result.requesterPhone, undefined);
  assert.equal(result.sosLocation, undefined);
  assert.equal(result.responses[0].donorPhone, undefined);
  assert.equal(original.responses[0].donorPhone, 'private');
});
