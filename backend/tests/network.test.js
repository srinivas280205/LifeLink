const {test} = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const {clientKey, corsOptions} = require('../services/networkPolicy');
test('different members on one Wi-Fi have independent API limits; forged tokens do not', () => {
 process.env.JWT_SECRET='network-test-only';
 const req = token => ({ip:'192.168.1.2',headers:{authorization:`Bearer ${token}`}});
 const a=clientKey(req(jwt.sign({userId:'a'},process.env.JWT_SECRET)));
 const b=clientKey(req(jwt.sign({userId:'b'},process.env.JWT_SECRET)));
 assert.notEqual(a,b);
 assert.match(clientKey(req(jwt.sign({userId:'a'},'wrong'))),/^ip:/);
 assert.match(clientKey(req(jwt.sign({userId:'a',purpose:'reset'},process.env.JWT_SECRET))),/^ip:/);
});
test('production CORS requires and restricts frontend origins', () => {
 assert.throws(()=>corsOptions({NODE_ENV:'production'}));
 const options=corsOptions({NODE_ENV:'production',FRONTEND_ORIGINS:'https://lifelink.example'});
 options.origin('https://lifelink.example',(error,allow)=>assert.equal(allow,true));
 options.origin('https://other.example',(error,allow)=>assert.equal(allow,false));
});
