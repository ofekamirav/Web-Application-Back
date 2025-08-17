import request from 'supertest';
import { app } from './setup';
import mongoose from 'mongoose'; 


const unique = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;

const mkUser = () => ({
  name: 'Test User',
  email: unique('commenter'),
  password: 'Password123!',
});

async function auth() {
  const u = mkUser();
  await request(app).post('/auth/register').send(u).expect(201);
  const login = await request(app).post('/auth/login').send({ email: u.email, password: u.password }).expect(200);
  return { token: login.body.accessToken, user: login.body.user };
}

async function createRecipe(token: string) {
  const payload = {
    title: 'Recipe For Comments Test',
    description: 'A recipe created for testing comments functionality.',
    instructions: 'Follow the test steps.',
    ingredients: JSON.stringify(['jest', 'supertest']),
  };
  const res = await request(app)
    .post('/recipes')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
  expect(res.status).toBe(201);
  return res.body;
}


describe('Comments API Routes', () => {
  let userA: { token: string, user: { _id: string } };
  let userB: { token: string, user: { _id: string } };
  let recipe: { _id: string };

  beforeAll(async () => {
    userA = await auth();
    userB = await auth();
    recipe = await createRecipe(userA.token);
  });

  describe('GET /comments', () => {
    it('should fail with 400 Bad Request if recipe query parameter is missing', async () => {
      const res = await request(app).get('/comments');
      expect(res.status).toBe(400);
    });

    it('should return 200 and an empty array for a recipe with no comments', async () => {
      const newRecipe = await createRecipe(userA.token);
      const res = await request(app).get('/comments').query({ recipe: newRecipe._id });
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]); 
    });

    it('should return 200 and a list of comments for a valid recipe ID', async () => {
      await request(app)
        .post('/comments')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ text: 'A comment to be fetched.', recipe: recipe._id });

      const res = await request(app).get('/comments').query({ recipe: recipe._id });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('text', 'A comment to be fetched.');
    });
  });

  describe('POST /comments', () => {
    it('should create a new comment successfully with valid data and authentication', async () => {
      const res = await request(app)
        .post('/comments')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ text: 'This is a great recipe!', recipe: recipe._id });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('text', 'This is a great recipe!');
      expect(res.body).toHaveProperty('author', userA.user._id);
    });

    it('should fail with 401 Unauthorized if no token is provided', async () => {
      const res = await request(app)
        .post('/comments')
        .send({ text: 'Trying to post without auth.', recipe: recipe._id });

      expect(res.status).toBe(401);
    });

    it('should fail with 400 Bad Request if "text" field is missing', async () => {
      const res = await request(app)
        .post('/comments')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ recipe: recipe._id }); // Missing 'text'

      expect(res.status).toBe(400);
    });

    it('should fail with 400 Bad Request if "recipe" field is missing', async () => {
      const res = await request(app)
        .post('/comments')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ text: 'My recipe is missing.' }); // Missing 'recipe'

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /comments/:id', () => {
    let commentId: string;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/comments')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ text: 'A comment to be updated.', recipe: recipe._id });
      commentId = createRes.body._id;
    });

    it('should update a comment successfully if the user is the author', async () => {
      const res = await request(app)
        .put(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ text: 'This is the updated text!' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('text', 'This is the updated text!');
    });

    it('should fail with 403 Forbidden if another user tries to update it', async () => {
      const res = await request(app)
        .put(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${userB.token}`) 
        .send({ text: 'Hacked by user B!' });

      expect(res.status).toBe(403);
    });

    it('should fail with 401 Unauthorized if no token is provided', async () => {
      const res = await request(app)
        .put(`/comments/${commentId}`)
        .send({ text: 'Updating without auth.' });

      expect(res.status).toBe(401);
    });

    it('should fail with 404 Not Found if the comment ID does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString(); 
      const res = await request(app)
        .put(`/comments/${nonExistentId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ text: 'This will not work.' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /comments/:id', () => {
    let commentId: string;

    beforeEach(async () => {
      const createRes = await request(app)
        .post('/comments')
        .set('Authorization', `Bearer ${userA.token}`)
        .send({ text: 'A comment to be deleted.', recipe: recipe._id });
      commentId = createRes.body._id;
    });

    it('should delete a comment successfully if the user is the author', async () => {
      const res = await request(app)
        .delete(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${userA.token}`);
      
      expect(res.status).toBe(204);
    });

    it('should fail with 403 Forbidden if another user tries to delete it', async () => {
      const res = await request(app)
        .delete(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${userB.token}`); 
      
      expect(res.status).toBe(403);
    });

    it('should fail with 401 Unauthorized if no token is provided', async () => {
      const res = await request(app).delete(`/comments/${commentId}`);
      expect(res.status).toBe(401);
    });

    it('should fail with 404 Not Found if the comment ID does not exist', async () => {
      await request(app)
        .delete(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${userA.token}`);
      
      const res = await request(app)
        .delete(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${userA.token}`);
      
      expect(res.status).toBe(404);
    });
  });
});