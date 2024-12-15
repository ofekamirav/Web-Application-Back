import request from "supertest";
import initApp from "../server";
import  Post  from "../models/posts_model";
import mongoose from "mongoose";
import { Express } from "express";


let app: Express;

beforeAll(async () => {
    console.log("init app");
    app = await initApp();
    console.log("app initialized");
    await Post.deleteMany({});
    console.log("Delete all posts before testing");
});

afterAll(async () => {
    await mongoose.connection.close();
});

type UserInfo={
    email: string,
    name: string,
    password: string,
    id?: string,
    token?: string
}

const userInfo:UserInfo={
    email: "ofek@gmail.com",
    name: "Ofek",
    password: "12345678"
}

describe("Auth Tests",()=>{ 
    test("Register test", async () => {
        const response = await request(app).post("/auth/register").send(userInfo);
        console.log(response.body);
        expect(response.statusCode).toBe(201);
    });

   




});


