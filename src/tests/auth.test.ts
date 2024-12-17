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

    test("Login test", async () => {
        const response = await request(app).post("/auth/login").send({
            email: userInfo.email,
            password: userInfo.password
        });
        console.log(response.body);
        expect(response.statusCode).toBe(200);
        userInfo.id=response.body._id;
        userInfo.token=response.body.token;
    });

   


});


