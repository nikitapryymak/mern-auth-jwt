import mongoose from "mongoose";
import { MONGO_URI } from "../constants/env";

const connectToDatabase = async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(MONGO_URI);
    console.log("Successfully connected to DB!");
  } catch (error) {
    console.error("Could not connect to DB", error);
    process.exit(1);
  }
};
export default connectToDatabase;
