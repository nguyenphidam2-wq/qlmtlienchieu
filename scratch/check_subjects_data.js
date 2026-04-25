
const mongoose = require("mongoose");
const MONGODB_URI = "mongodb://localhost:27017/qlmt-lienchieu";

async function checkSubjects() {
  try {
    await mongoose.connect(MONGODB_URI);
    const subjects = await mongoose.connection.db.collection("subjects").find({}).toArray();
    console.log(`Total subjects: ${subjects.length}`);
    subjects.forEach((s, i) => {
      console.log(`${i+1}. Name: ${s.full_name}, Lat: ${s.lat}, Lng: ${s.lng}, Approval: ${s.approval_status}, TDP: ${s.tdp}`);
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkSubjects();
