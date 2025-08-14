import request from 'supertest';
import { app } from './setup';

async function makeUser() {
  const email = `user_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
  const password = 'Password123!';

  const reg = await request(app)
    .post('/auth/register')
    .send({ name: 'User One', email, password });
  const userId = reg.body.user._id as string;

  const login = await request(app)
    .post('/auth/login')
    .send({ email, password });

  const token = login.body.accessToken as string;

  return { token, userId, email };
}

describe('Users API (integration style)', () => {
  let token: string;
  let userId: string;

  beforeEach(async () => {
    const u = await makeUser();
    token = u.token;
    userId = u.userId;
  });

  describe('GET /users/me', () => {
    it('401 without token', async () => {
      const res = await request(app).get('/users/me');
      expect(res.status).toBe(401);
    });

    it('200 with token', async () => {
      const res = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(userId);
      expect(typeof res.body.email).toBe('string');
    });
  });

  describe('PUT /users/me', () => {
    it('updates name', async () => {
      const res = await request(app)
        .put('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'Updated Name');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
    });

    it('rejects short name', async () => {
      const res = await request(app)
        .put('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'A');

      expect(res.status).toBe(400);
    });
  });

  describe('GET /users/:id', () => {
    it('returns public profile + recipes array', async () => {
      const res = await request(app).get(`/users/${userId}`);

      expect(res.status).toBe(200);
      expect(res.body.user._id).toBe(userId);
      expect(Array.isArray(res.body.recipes)).toBe(true);
    });

    it('400 invalid id', async () => {
      const res = await request(app).get('/users/123');
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /users/me', () => {
    it('deletes account', async () => {
      const del = await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect([204, 200]).toContain(del.status);

      const after = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect([401, 404]).toContain(after.status);
    });
  });
});
