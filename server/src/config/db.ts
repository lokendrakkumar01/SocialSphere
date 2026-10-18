import mongoose from 'mongoose';
import { env } from './env';

let mongodInstance: any = null;

export const connectDB = async (): Promise<void> => {
  // If already connected, do nothing
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const isTest = process.env.NODE_ENV === 'test';

  if (!isTest) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`[DB] Connected to MongoDB at ${env.MONGODB_URI}`);
      return;
    } catch (err: any) {
      console.warn(`[DB] Standard MongoDB connection failed (${err.message}). Initializing in-memory MongoDB for local evaluation...`);
    }
  }

  // In-memory MongoDB
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    if (!mongodInstance) {
      mongodInstance = await MongoMemoryServer.create();
    }
    const uri = mongodInstance.getUri();
    await mongoose.connect(uri);
    console.log(`[DB] Connected successfully to in-memory MongoDB (${uri})`);
  } catch (memErr: any) {
    console.error('[DB] Failed to initialize in-memory MongoDB:', memErr.message);
    throw memErr;
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
};
