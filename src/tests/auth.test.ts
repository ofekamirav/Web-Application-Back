import request from "supertest";
import initApp from "../server";
import UserModel from "../models/users_model";
import mongoose from "mongoose";
import { Express } from "express";


let app: Express;

beforeAll(async () => {
    console.log("init app");
    app = await initApp();
    console.log("app initialized");
    await UserModel.deleteMany({});
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
    token?: string
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
        console.log(response.body);
        expect(response.statusCode).toBe(201);
    });

    test("Login test", async () => {
        const response = await request(app).post(baseURL + "/login").send(userInfo)
        console.log(response.body);
        expect(response.statusCode).toBe(200);
        expect(response.body.token).toBeDefined();
        expect(response.body._id).toBeDefined();
        userInfo.id=response.body._id;
        userInfo.token=response.body.token;
    });

    test("Post test", async () => {
        const response = await request(app).post(baseURL + "/post")
        .set({ authorization: "JWT " + userInfo.token })
        .send({
        title: "test post",
        content: "test content",
        owner: "Nitzan"
    });
        expect(response.statusCode).toBe(201);
    });
});


