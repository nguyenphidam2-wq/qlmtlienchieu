import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongodb";
import { Subject } from "../src/lib/models/Subject";

async function clearSubjects() {
  try {
    console.log("Connecting to database...");
    await connectDB();
    
    console.log("Connected. Counting existing subjects...");
    const count = await Subject.countDocuments();
    console.log(`Found ${count} subjects.`);

    if (count > 0) {
      console.log("Deleting all subjects...");
      await Subject.deleteMany({});
      console.log(`Successfully deleted ${count} subjects!`);
    } else {
      console.log("No subjects to delete.");
    }
  } catch (error) {
    console.error("Error clearing subjects:", error);
  } finally {
    console.log("Disconnecting...");
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearSubjects();
