import request from 'supertest';
import { app } from './setup';

const unique = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
const mkUser = () => ({
  name: 'User One',
  email: unique('user'),
  password: 'Password123!',
});

async function registerAndLogin() {
  const u = mkUser();
  await request(app).post('/auth/register').send(u).expect(201);
  const login = await request(app)
    .post('/auth/login')
    .send({ email: u.email, password: u.password })
    .expect(200);
  return { token: login.body.accessToken, user: login.body.user, creds: u };
}

describe('Users routes', () => {
  describe('GET /users/me', () => {
    it('200 – returns current profile', async () => {
      const s = await registerAndLogin();
      const res = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${s.token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', s.creds.email);
    });

    it('401 – no token', async () => {
      const res = await request(app).get('/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /users/me', () => {
    it('200 – updates name (>=2 chars) and (if Regular) email', async () => {
      const s = await registerAndLogin();
      const res = await request(app)
        .put('/users/me')
        .set('Authorization', `Bearer ${s.token}`)
        .send({ name: 'Updated Name', email: unique('newmail') });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated Name');
      expect(res.body).toHaveProperty('email');
    });

    it('400 – rejects short name', async () => {
      const s = await registerAndLogin();
      const res = await request(app)
        .put('/users/me')
        .set('Authorization', `Bearer ${s.token}`)
        .send({ name: 'A' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /users/me/password', () => {
    it('200 – changes password (Regular)', async () => {
      const { token, creds } = await registerAndLogin();
      const res = await request(app)
        .put('/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: creds.password, newPassword: 'NewPass123!' });
      expect(res.status).toBe(200);

      const reLogin = await request(app)
        .post('/auth/login')
        .send({ email: creds.email, password: 'NewPass123!' });
      expect(reLogin.status).toBe(200);
    });

    it('401 – wrong old password', async () => {
      const { token } = await registerAndLogin();
      const res = await request(app)
        .put('/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ oldPassword: 'WrongOld!', newPassword: 'NewPass123!' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /users/:id', () => {
    it('200 – returns public profile (and recipes array)', async () => {
      const s = await registerAndLogin();
      const res = await request(app).get(`/users/${s.user._id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('recipes');
      expect(Array.isArray(res.body.recipes)).toBe(true);
    });

    it('400 – invalid id format', async () => {
      const res = await request(app).get('/users/not-a-valid-id');
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /users/me', () => {
    it('204 – deletes current user', async () => {
      const s = await registerAndLogin();
      const del = await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${s.token}`);
      expect(del.status).toBe(204);

      const me = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${s.token}`);
      expect([401, 404]).toContain(me.statusCode);
    });
  });
});
