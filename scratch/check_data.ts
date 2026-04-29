
import mongoose from "mongoose";

const URI = "mongodb://localhost:27017/qlmt-lienchieu";

async function check() {
  const conn = await mongoose.connect(URI);
  const Subject = conn.model("Subject", new mongoose.Schema({}, { strict: false }), "subjects");
  
  const total = await Subject.countDocuments({});
  const withCoords = await Subject.countDocuments({ lat: { $exists: true, $ne: null, $ne: 0 } });
  const pending = await Subject.countDocuments({ approval_status: { $ne: "Approved" } });
  const approved = await Subject.countDocuments({ approval_status: "Approved" });

  console.log(`Total subjects: ${total}`);
  console.log(`Subjects with lat/lng: ${withCoords}`);
  console.log(`Subjects Pending/Not Approved: ${pending}`);
  console.log(`Subjects Approved: ${approved}`);

  if (total > 0) {
    const sample = await Subject.findOne({});
    console.log("Sample keys:", Object.keys(sample?.toObject() || {}));
  }

  process.exit(0);
}

check();