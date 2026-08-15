process.env.JWT_SECRET = 'testsecret';
process.env.REFRESH_TOKEN_SECRET = 'refreshsecret';
jest.mock('../src/config/prisma', () => ({
  user: {
    findUnique: jest.fn().mockResolvedValue({ id: 'u1', email: 'bob@example.com', password: '$2b$10$e', roleId: 1, isActive: true }),
    update:     jest.fn().mockResolvedValue({})
  }
}));

jest.mock('bcrypt', () => ({ compare: jest.fn().mockResolvedValue(true) }));

const request = require('supertest');
const app = require('../src/app');

test('Login returns tokens on valid credentials', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'bob@example.com', password: 'x' });
  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty('accessToken');
  expect(res.body).toHaveProperty('refreshToken');
});
