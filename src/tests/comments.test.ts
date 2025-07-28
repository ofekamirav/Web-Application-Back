import request from 'supertest';
import { app } from './setup'; 
describe('Comments API Endpoints', () => {
  let userToken: string;
  let userId: string;
  let recipeId: string;

  beforeAll(async () => {
    const registerRes = await request(app)
      .post('/auth/register')
      .send({
        name: 'Commenter User',
        email: 'commenter@example.com',
        password: 'Password123!',
      });
    userId = registerRes.body.user._id;

    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'commenter@example.com',
        password: 'Password123!',
      });
    userToken = loginRes.body.accessToken;

    const recipeRes = await request(app)
      .post('/recipes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Recipe for Comments',
        description: 'A recipe to test comments on.',
        ingredients: ['ingredient 1'],
        instructions: 'Test instructions.',
      });
    recipeId = recipeRes.body._id;
  });

  describe('POST /comments', () => {
    it('should create a new comment successfully', async () => {
      const res = await request(app)
        .post('/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          text: 'This is a great recipe!',
          recipe: recipeId, 
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body.text).toBe('This is a great recipe!');
      expect(res.body.author).toBe(userId); // Author should be the logged-in user
      expect(res.body.recipe).toBe(recipeId);
    });

    it('should fail to create a comment without required fields (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          recipe: recipeId, // Missing 'text'
        });
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('GET /comments', () => {
    it('should get all comments for a specific recipe', async () => {
      // First, ensure a comment exists
      await request(app)
        .post('/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: 'Another comment', recipe: recipeId });

      const res = await request(app)
        .get(`/comments?recipe=${recipeId}`); 

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].recipe).toBe(recipeId);
    });

    it('should fail if recipe ID is not provided (400 Bad Request)', async () => {
        const res = await request(app).get('/comments'); // No recipe query parameter
        expect(res.statusCode).toEqual(400);
    });
  });

  describe('PUT /comments/:id & DELETE /comments/:id', () => {
    let commentId: string;
    let anotherUserToken: string;

    beforeAll(async () => {
        await request(app).post('/auth/register').send({ name: 'Other User', email: 'other@example.com', password: 'Password123!' });
        const loginRes = await request(app).post('/auth/login').send({ email: 'other@example.com', password: 'Password123!' });
        anotherUserToken = loginRes.body.accessToken;
    });

    beforeEach(async () => {
        const res = await request(app)
            .post('/comments')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ text: 'A comment to modify', recipe: recipeId });
        commentId = res.body._id;
    });

    it('should allow the author to update their own comment', async () => {
      const res = await request(app)
        .put(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ text: 'Updated text!' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.text).toBe('Updated text!');
    });

    it('should NOT allow another user to update a comment (403 Forbidden)', async () => {
        const res = await request(app)
          .put(`/comments/${commentId}`)
          .set('Authorization', `Bearer ${anotherUserToken}`) // Using the wrong user's token
          .send({ text: 'Trying to hack!' });
        expect(res.statusCode).toEqual(403);
    });

    it('should allow the author to delete their own comment', async () => {
        const res = await request(app)
          .delete(`/comments/${commentId}`)
          .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toEqual(204);
    });

    it('should NOT allow another user to delete a comment (403 Forbidden)', async () => {
        const res = await request(app)
          .delete(`/comments/${commentId}`)
          .set('Authorization', `Bearer ${anotherUserToken}`); // Using the wrong user's token
        expect(res.statusCode).toEqual(403);
    });
  });
});
