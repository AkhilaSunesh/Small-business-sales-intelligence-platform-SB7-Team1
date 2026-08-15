const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/auth/auth.controller', () => ({
    register:       jest.fn((req, res) => res.status(201).json({ success: true, message: 'Registered' })),
    login:          jest.fn((req, res) => res.status(200).json({ success: true, message: 'Logged in', accessToken: 'test-token', refreshToken: 'refresh-token', user: { id: 'user-id', roleId: 1 } })),
    refreshToken:   jest.fn((req, res) => res.status(200).json({ success: true, accessToken: 'new-access-token' })),
    me:             jest.fn((req, res) => res.status(200).json({ success: true, user: { id: 'user-id', roleId: 1, role: { name: 'Business Owner' } } })),
    logout:         jest.fn((req, res) => res.status(200).json({ success: true, message: 'Logged out successfully.' })),
    changePassword: jest.fn((req, res) => res.status(200).json({ success: true, message: 'Password updated successfully.' }))
}));

const app = require('../src/app');

beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
});

describe('Security API Gateway Auth Routes', () => {
    test('POST /api/auth/register should validate request payload', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ email: 'test@example.com', password: 'password', roleId: 1 });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('errors');
    });

    test('POST /api/auth/login should validate request payload', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: 'not-an-email', password: 'password' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test('POST /api/auth/register should route to auth controller', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ name: 'Alice', email: 'alice@example.com', password: 'password', roleId: 1 });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Registered');
    });

    test('POST /api/auth/refresh should require refreshToken', async () => {
        const response = await request(app)
            .post('/api/auth/refresh')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });
});
