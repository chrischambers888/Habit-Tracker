import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "Missing MONGODB_URI. Please set it in your environment variables.",
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
      dbName: process.env.MONGODB_DB_NAME,
    });
  }

  cached.conn = await cached.promise;

  return cached.conn;
}

