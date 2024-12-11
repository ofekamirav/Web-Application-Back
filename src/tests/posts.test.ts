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

let postID= "";

const testPost1 = {
    title: "Post 1",
    content: "Content of post 1", 
    owner: "Ofek Amirav"
};

const UpdatePost = {
    title: "Post Updated",
    content: "Content of post 2", 
    owner: "Ofek Amirav"
};

const invalidPost = {
    title: "Post 3",
    content: "Content of post 3"
};

describe("Posts Tests",()=>{
    test("Get All Posts test", async () => {
        const response = await request(app).get("/post");
        console.log(response.body);//print all posts
        expect(response.statusCode).toBe(200);//expecting for 200 Ok
    });

    test("Create Post test", async () => {
        const response = await request(app).post("/post").send(testPost1);
        console.log(response.body);//print the post that was created
        expect(response.statusCode).toBe(201);//expecting for 201 Created
        postID = response.body._id;
    });

    test("Test Create Invalid Post", async () => {
        const response = await request(app).post("/post").send(invalidPost);
        expect(response.statusCode).toBe(400);//expecting for 400 Bad Request
    }
    );

    test("Get Post by ID test", async () => {
        const response = await request(app).get("/post/"+postID);
        console.log(response.body);//print the post that was found
        expect(response.statusCode).toBe(200);//expecting for 200 Ok
    });

    test("Update Post test", async () => {
        const response = await request(app).put("/post/"+postID).send(UpdatePost);
        console.log(response.body);//print the post that was updated
        expect(response.statusCode).toBe(200);//expecting for 200 Ok
    });

    test("Get Post By Owner test", async () => {
        const response = await request(app).get("/post?owner="+testPost1.owner);
        console.log(response.body);//print the post that was found by owner
        expect(response.statusCode).toBe(200);//expecting for 200 Ok
    });

    test("Delete Post test", async () => {
        const response = await request(app).delete("/post/"+postID);
        console.log(response.body);//print the post that was deleted
        expect(response.statusCode).toBe(200);//expecting for 200 Ok
    });

});

afterAll(async () => {
    await mongoose.connection.close();
});

