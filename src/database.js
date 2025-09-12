import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config();

const MAX_RETRIES = parseInt(process.env.DB_MAX_RETRIES ?? "3", 10);
const RETRY_DELAY_MS = parseInt(process.env.DB_RETRY_DELAY_MS ?? "5000", 10);

const dbConnection = async () => {
  const uri = process.env.SOFIA_TEST_URI || process.env.MONGO_URL;
  if (!uri) {
    console.log("Database URI not set, skipping DB connection");
    return false;
  }
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri);
      console.log("Connected to the database");
      return true;
    } catch (err) {
      console.error(
        `Error connecting to the database (attempt ${attempt}/${MAX_RETRIES}):`,
        err?.message ?? err
      );
      if (attempt < MAX_RETRIES) {
        await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
      } else if (process.env.NODE_ENV === "production") {
        console.error("Exiting process due to persistent DB connection failures");
        process.exit(1);
      }
    }
  }
  return false;
};

export default dbConnection;