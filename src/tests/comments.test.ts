import request from 'supertest';
import initApp from '../server';
import mongoose from 'mongoose';
import { Express } from 'express';
import Comment from '../models/comment_model';
import User from '../models/users_model';

let app: Express;

const testComment = {
    comment: "Test Comment",
    postId: "12456123548",
    owner: "Nitzan",
};

type UserTemplate = {
    email: string,
    name: string,
    password: string,
    id?: string,
    token?: string
}

const userInfo: UserTemplate = {
    email: "ofek@gmail.com",
    name: "Ofek",
    password: "12345678"
}

beforeAll(async () => {
    app = await initApp();
    console.log('beforeAll');
    await Comment.deleteMany({});
    await User.deleteMany({});
    console.log('Delete all comments and users before testing');

    await request(app).post("/auth/register").send(userInfo);
    const res = await request(app).post("/auth/login").send(userInfo);
    userInfo.token = res.body.accessToken;
    userInfo.id = res.body._id;
    expect(userInfo.token).toBeDefined();
});

afterAll(async () => {
    await mongoose.connection.close();
    console.log('afterAll');
});

let commentId = "";

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
        const response = await request(app).post("/comment")
            .set({ authorization: "JWT " + userInfo.token })
            .send(testComment);
        expect(response.status).toBe(201);
        expect(response.body.comment).toBe(testComment.comment);
        expect(response.body.owner).toBe(testComment.owner);
        expect(response.body.postId).toBe(testComment.postId);
        commentId = response.body._id;
    });

    test("Test adding a new comment with invalid data", async () => {
        const response = await request(app).post("/comment")
            .set({ authorization: "JWT " + userInfo.token })
            .send(invalidComment);
        expect(response.status).toBe(400); // Expecting 400 Bad Request
    });

    test("Test get comment by id", async () => {
        const response = await request(app).get("/comment/" + commentId);
        expect(response.status).toBe(200);
        expect(response.body._id).toBe(commentId);
    });

    test("Test get comment by invalid id", async () => {
        const invalidId = commentId + "1"; 
        const response = await request(app).get("/comment/" + invalidId);
        console.log(response.body);
        expect(response.status).toBe(404); 
    });
});