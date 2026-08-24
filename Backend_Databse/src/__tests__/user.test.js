const request = require('supertest');
const express = require('express');
const userController = require('../controllers/user.controller');
const prisma = require('../config/prisma');

describe('User Controller Integration Tests', () => {
    let app;
    let testUserId;

    beforeAll(async () => {
        app = express();
        app.use(express.json());
        app.get('/api/users', userController.getUsers);
        app.get('/api/users/:id', userController.getUserById);
        app.put('/api/users/:id', userController.updateUser);
        app.patch('/api/users/:id', userController.updateUser);
        app.patch('/api/users/:id/status', userController.updateUserStatus);
        app.delete('/api/users/:id', userController.deleteUser);

        // Create a dedicated test user
        const testUser = await prisma.user.create({
            data: {
                name: 'Test Deletion User',
                email: `testdelete_${Date.now()}@marketmind.dev`,
                password: 'hashedpassword',
                roleId: 3,
                isActive: true,
                isDeleted: false,
                isPending: false
            }
        });
        testUserId = testUser.id;
    });

    afterAll(async () => {
        if (testUserId) {
            await prisma.user.deleteMany({ where: { id: testUserId } }).catch(() => {});
        }
        await prisma.$disconnect();
    });

    test('DELETE /api/users/:id sets isDeleted=true and isActive=false', async () => {
        const res = await request(app).delete(`/api/users/${testUserId}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify that user is not returned in getUsers
        const getRes = await request(app).get('/api/users');
        expect(getRes.status).toBe(200);
        const found = getRes.body.data.find(u => u.id === testUserId);
        expect(found).toBeUndefined();

        // Check DB row directly
        const dbUser = await prisma.user.findUnique({ where: { id: testUserId } });
        expect(dbUser.isDeleted).toBe(true);
        expect(dbUser.isActive).toBe(false);
    });

    test('DELETE /api/users/:id returns 404 for nonexistent user', async () => {
        const res = await request(app).delete('/api/users/non-existent-uuid');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});
