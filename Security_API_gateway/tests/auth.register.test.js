jest.mock('../src/config/prisma', () => ({
  user: {
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'u1', name: 'Alice', email: 'alice@example.com', roleId: 1 })
  }
}));

const request = require('supertest');
const app = require('../src/app');

test('Register returns 201 on success', async () => {
  const res = await request(app).post('/api/auth/register').send({ name: 'Alice', email: 'alice@example.com', password: 'Password1!', roleId: 1 });
  expect([201,200]).toContain(res.statusCode);
  expect(res.body).toHaveProperty('user');
});
