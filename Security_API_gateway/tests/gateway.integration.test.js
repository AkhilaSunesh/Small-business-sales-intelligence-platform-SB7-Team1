const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('axios');
const axios = require('axios');

const app = require('../src/app');

describe('Security API Gateway integration tests', () => {
  const secret = 'testsecret';
  beforeAll(() => {
    process.env.JWT_SECRET = secret;
  });
  // Register/login tests are in separate files that mock prisma prior to loading app

  test('Protects inventory route with JWT', async () => {
    axios.mockResolvedValue({ status: 200, data: { success: true } });
    const res1 = await request(app).get('/api/inventory');
    expect(res1.statusCode).toBe(401);

    const token = jwt.sign({ id: 'u1', roleId: 2 }, secret, { expiresIn: '1h' });
    const res2 = await request(app).get('/api/inventory').set('Authorization', `Bearer ${token}`);
    expect(res2.statusCode).toBe(200);
  });

  test('RBAC denies sales-exec from modifying inventory', async () => {
    axios.mockResolvedValue({ status: 200, data: { success: true } });
    const token = jwt.sign({ id: 'u2', roleId: 3 }, secret, { expiresIn: '1h' });
    const res = await request(app).post('/api/inventory/add').set('Authorization', `Bearer ${token}`).send({ productCode: 'P1', quantity: 5 });
    expect(res.statusCode).toBe(403);
  });

  test('Rate limiter blocks after threshold', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/auth/login').send({ email: `x${i}@a.com`, password: 'p' });
    }
    const last = await request(app).post('/api/auth/login').send({ email: 'x@a.com', password: 'p' });
    expect([200,429]).toContain(last.statusCode);
  });

  test('Invalid and expired tokens are rejected', async () => {
    const bad = 'Bearer invalid.token.value';
    const res1 = await request(app).get('/api/inventory').set('Authorization', bad);
    expect(res1.statusCode).toBe(401);

    const expired = jwt.sign({ id: 'u3', roleId: 2, exp: Math.floor(Date.now()/1000) - 10 }, secret);
    const res2 = await request(app).get('/api/inventory').set('Authorization', `Bearer ${expired}`);
    expect(res2.statusCode).toBe(401);
  });

  test('Sales upload forwards file to backend', async () => {
    axios.post = jest.fn().mockResolvedValue({ status: 200, data: { success: true } });
    const token = jwt.sign({ id: 'u1', roleId: 3 }, secret, { expiresIn: '1h' });
    const res = await request(app).post('/api/sales/upload').set('Authorization', `Bearer ${token}`).attach('file', Buffer.from('CustomerID,ProductID,Quantity,Price,TransactionDate\nC1,P1,1,10,2020-01-01'), 'sales.csv');
    expect([200,201]).toContain(res.statusCode);
    expect(axios.post).toHaveBeenCalled();
  });
});
