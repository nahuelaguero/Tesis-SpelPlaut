import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/spelplaut-db";

// Forzar nombre de base de datos spelplaut-db si la URI no lo especifica
const DB_NAME = "spelplaut-db";

if (!MONGODB_URI) {
  throw new Error(
    "Por favor define la variable MONGODB_URI en el archivo .env.local"
  );
}

interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseConnection | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    };

    cached!.promise = mongoose.connect(MONGODB_URI, { ...opts, dbName: DB_NAME });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectDB;
