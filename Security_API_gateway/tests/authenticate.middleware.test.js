const authenticate = require('../src/middleware/authenticate');
const { createRequest, createResponse } = require('node-mocks-http');
const jwt = require('jsonwebtoken');

jest.mock('../src/middleware/auditLogger', () => ({
    logEvent: jest.fn()
}));

describe('authenticate middleware', () => {
    beforeAll(() => {
        process.env.JWT_SECRET = 'test-secret';
    });

    test('returns 401 when Authorization header is missing', () => {
        const req = createRequest({
            method: 'GET',
            url: '/api/inventory',
            originalUrl: '/api/inventory'
        });
        const res = createResponse();
        const next = jest.fn();

        authenticate(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(res._getJSONData().success).toBe(false);
        expect(next).not.toHaveBeenCalled();
    });

    test('returns 401 for invalid token', () => {
        const req = createRequest({
            method: 'GET',
            url: '/api/inventory',
            originalUrl: '/api/inventory',
            headers: {
                authorization: 'Bearer invalid.token'
            }
        });
        const res = createResponse();
        const next = jest.fn();

        authenticate(req, res, next);

        expect(res.statusCode).toBe(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('sets req.user for valid token', () => {
        const token = jwt.sign({ id: 'user-id', roleId: 1 }, process.env.JWT_SECRET);
        const req = createRequest({
            method: 'GET',
            url: '/api/inventory',
            originalUrl: '/api/inventory',
            headers: {
                authorization: `Bearer ${token}`
            }
        });
        const res = createResponse();
        const next = jest.fn();

        authenticate(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.user.id).toBe('user-id');
    });
});
