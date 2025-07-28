import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import initApp from '../server';
import { Express } from 'express';

let mongoServer: MongoMemoryServer;
export let app: Express;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.DB_CONNECTION = mongoUri; // Set the DB_CONNECTION environment variable to the in-memory MongoDB URI
  app = await initApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});
