import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  // If already connected, do nothing
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[DB] Connected to MongoDB`);
  } catch (err: any) {
    console.error(`[DB] MongoDB connection failed: ${err.message}`);
    throw err;
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[DB] MongoDB disconnected');
  }
};
