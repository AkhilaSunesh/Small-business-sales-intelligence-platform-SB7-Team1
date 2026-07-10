const authorize = require('../src/middleware/authorize');
const { createRequest, createResponse } = require('node-mocks-http');

jest.mock('../src/middleware/auditLogger', () => ({
    logEvent: jest.fn()
}));

describe('authorize middleware', () => {
    test('returns 403 when no user is present', () => {
        const req = createRequest({
            method: 'GET',
            url: '/api/inventory',
            originalUrl: '/api/inventory'
        });
        const res = createResponse();
        const next = jest.fn();

        authorize(req, res, next);

        expect(res.statusCode).toBe(403);
        expect(res._getJSONData().success).toBe(false);
        expect(next).not.toHaveBeenCalled();
    });

    test('allows full access for role 1', () => {
        const req = createRequest({
            method: 'PUT',
            url: '/api/inventory/update',
            originalUrl: '/api/inventory/update',
            user: { id: 'user-id', roleId: 1 }
        });
        const res = createResponse();
        const next = jest.fn();

        authorize(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    test('allows sales upload for role 3', () => {
        const req = createRequest({
            method: 'POST',
            url: '/api/sales/upload',
            originalUrl: '/api/sales/upload',
            user: { id: 'sales-id', roleId: 3 }
        });
        const res = createResponse();
        const next = jest.fn();

        authorize(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    test('rejects inventory get for role 3', () => {
        const req = createRequest({
            method: 'GET',
            url: '/api/inventory',
            originalUrl: '/api/inventory',
            user: { id: 'sales-id', roleId: 3 }
        });
        const res = createResponse();
        const next = jest.fn();

        authorize(req, res, next);

        expect(res.statusCode).toBe(403);
        expect(next).not.toHaveBeenCalled();
    });
});
