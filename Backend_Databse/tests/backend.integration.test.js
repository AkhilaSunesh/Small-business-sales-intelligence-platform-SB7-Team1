const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../src/app');

describe('Backend_Databse minimal tests', () => {
  const secret = 'testsecret';
  beforeAll(() => { process.env.JWT_SECRET = secret; });

  test('Backend rejects unauthenticated inventory access', async () => {
    const res = await request(app).get('/api/inventory');
    expect(res.statusCode).toBe(401);
  });

  test('Backend accepts authenticated inventory request (controller mocked)', async () => {
    // mock controller to avoid DB access
    jest.mock('../src/controllers/inventory.controller', () => ({
      getInventory: (req, res) => res.json({ success: true, inventory: [] }),
      addStock: (req, res) => res.json({ success: true }),
      updateStock: (req, res) => res.json({ success: true }),
      deleteInventory: (req, res) => res.json({ success: true })
    }));

    // reload app to pick up mocked controller
    jest.isolateModules(() => {
      const app2 = require('../src/app');
      const token = jwt.sign({ id: 'u1', roleId: 2 }, secret, { expiresIn: '1h' });
      return request(app2).get('/api/inventory').set('Authorization', `Bearer ${token}`).then(res => {
        expect(res.statusCode).toBe(200);
      });
    });
  });
});
