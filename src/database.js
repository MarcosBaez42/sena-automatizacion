import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const dbConnection = async () => {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    console.log("MONGO_URL not set, skipping DB connection");
    return false;
  }
  try {
    await mongoose.connect(uri);
    console.log("Connected to the database");
    return true;
  } catch {
    console.log("Error connecting to the database");
    return false;
  }
};

export default dbConnection;