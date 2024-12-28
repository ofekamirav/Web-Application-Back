import request from "supertest";
import initApp from "../server";
import UserModel from "../models/users_model";
import Post from "../models/posts_model";
import mongoose from "mongoose";
import { Express } from "express";


let app: Express;

beforeAll(async () => {
    console.log("init app");
    app = await initApp();
    console.log("app initialized");
    await UserModel.deleteMany({});
    await Post.deleteMany({});
    console.log("Delete all users before testing");
});

afterAll(async () => {
    await mongoose.connection.close();
});

type User = {
    email: string,
    name: string,
    password: string,
    id?: string,
    accessToken?: string;
    refreshToken?: string;
}

const userInfo: User = {
    email: "ofek@gmail.com",
    name: "Ofek",
    password: "12345678"
}


const baseURL = "/auth";

describe("Auth Tests",()=>{ 
    test("Register test", async () => {
        const response = await request(app).post(baseURL + "/register").send(userInfo);
        expect(response.statusCode).toBe(200);
    }); 
    
    test("Auth Registration fail", async () => {
        const response = await request(app).post(baseURL + "/register").send(userInfo);
        expect(response.statusCode).not.toBe(200); // this should fail because the user already exists
    });

    test("Login test", async () => {
        const response = await request(app).post(baseURL + "/login").send(userInfo)
        //console.log(response.body);
        expect(response.statusCode).toBe(200);
        userInfo.accessToken = response.body.accessToken;
        userInfo.refreshToken = response.body.refreshToken;
        userInfo.id = response.body._id;
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
        expect(response.body._id).toBeDefined();
        userInfo.accessToken = response.body.accessToken;
        userInfo.refreshToken = response.body.refreshToken;
    });

    test("Get protected API", async () => {
        const responce = await request(app).post("/post")
        .send({
            title: "Post 1 - without token",
            content: "Content of post 1", 
            owner: "Nitzan Naveh"
        });
        expect(responce.statusCode).not.toBe(201); // this should fail because we didn't send a token

        const response2 = await request(app).post("/post")
        .set({ authorization: "JWT " + userInfo.accessToken })
        .send({
            title: "Post 2",
            content: "Content of post 2", 
            owner: "invalid owner"
        });
        expect(response2.statusCode).toBe(201); // this should pass
    });

    test("Get protected API invalid token", async () => {
        const responce = await request(app).post("/post")
        .set({ authorization: "JWT " + userInfo.accessToken + '1' })
        .send({
            title: "Post 1 - without token",
            content: "Content of post 1", 
            owner: "Nitzan Naveh"
        });
        expect(responce.statusCode).not.toBe(201); 
    });

    test("Refresh token", async () => {
        const response = await request(app).post(baseURL + "/refresh")
        .send({
            refreshToken: userInfo.refreshToken
        });
        expect(response.statusCode).toBe(200);
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();
        userInfo.accessToken = response.body.accessToken;
        userInfo.refreshToken = response.body.refreshToken;
    });

    test("Logout - deactivate refresh token", async () => {
        const response = await request(app).post(baseURL + "/logout")
        .send({
            refreshToken: userInfo.refreshToken
        });
        expect(response.statusCode).toBe(200);

        const response2 = await request(app).post(baseURL + "/refresh") // try to refresh the token after logout
        .send({
            refreshToken: userInfo.refreshToken
        });
        expect(response2.statusCode).not.toBe(200); // token already deleted 
    });

    test("Refresh token multiple times useage", async () => {
        // login - get a refresh token
        const response = await request(app).post(baseURL + "/login")
        .send({
            email: userInfo.email,
            password: userInfo.password,
            name: userInfo.name,
        });
        expect(response.statusCode).toBe(200);
        userInfo.accessToken = response.body.accessToken;
        userInfo.refreshToken = response.body.refreshToken;

        // first use of refresh token - get a new one 
        const response2 = await request(app).post(baseURL + "/refresh")
        .send({
            refreshToken: userInfo.refreshToken
        });
        expect(response2.statusCode).toBe(200);
        const newRefreshToken = response2.body.refreshToken;

        // second use of refresh token - fail 
        const response3 = await request(app).post(baseURL + "/refresh")
        .send({
            refreshToken: userInfo.refreshToken
        });
        expect(response3.statusCode).not.toBe(200); // token already used

        // try to use the new refresh token - fail 
        const response4 = await request(app).post(baseURL + "/refresh")
        .send({
            refreshToken: newRefreshToken
        });
        expect(response4.statusCode).not.toBe(200);
    });

    test("Make sure 2 access tokens are different", async () => {
        const response = await request(app).post(baseURL + "/login")
        .send({
            email: userInfo.email,
            password: userInfo.password,
            name: userInfo.name,
        });
        expect(response.body.accessToken).not.toEqual(userInfo.accessToken);
    });


});

