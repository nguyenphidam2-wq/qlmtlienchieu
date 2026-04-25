
const mongoose = require("mongoose");
const MONGODB_URI = "mongodb://localhost:27017/qlmt-lienchieu";

async function checkUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    const users = await mongoose.connection.db.collection("users").find({}).toArray();
    console.log("Users in DB:");
    users.forEach(u => {
      console.log(`- Username: ${u.username}, Role: ${u.role}, FullName: ${u.full_name}`);
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkUsers();
