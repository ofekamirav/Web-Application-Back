import request from 'supertest';
import initApp from '../server';
import mongoose from 'mongoose';
import { Express } from 'express';
import Comment from '../models/comment_model';

let app: Express;

beforeAll(async () => {
    app = await initApp();
    console.log('beforeAll ');
    await Comment.deleteMany({});
});
 
afterAll(async () => {
    await mongoose.connection.close();
    console.log('afterAll');
});

let commentId = "";
const testComment = {
    comment: "Test Comment",
    postId: "12456123548",
    owner: "Nitzan",
};
const invalidComment = {
    content: "Test Content",
};

describe("Comments test suite", () => {
    test("Comment test get all comments", async () => {
        const response = await request(app).get("/comment");
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(0);
    });
    test("Test adding a new comment", async () => {
        const response = await request(app).post("/comment").send(testComment);
        expect(response.status).toBe(201);
        expect(response.body.comment).toBe(testComment.comment);
        expect(response.body.owner).toBe(testComment.owner);
        expect(response.body.postId).toBe(testComment.postId);
        commentId = response.body._id;
    });
    test("Test adding a new comment with invalid data", async () => {
        const response = await request(app).post("/comment").send(invalidComment);
        expect(response.status).toBe(201);
    });
    test("Test get comment by id", async () => {
        const response = await request(app).get("/comment/" + commentId);
        expect(response.status).toBe(200);
        expect(response.body._id).toBe(commentId);
    });
    test("Test get comment by invalid id", async () => {
        const response = await request(app).get("/comment/123");
        expect(response.status).toBe(404);
    });
        
});


