import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    await connectDB();
    
    // Wipe existing users for fresh demo test
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("123456", 10);
    
    const users = [
      { username: "admin", password_hash: passwordHash, full_name: "Admin Tổng", role: "admin" },
      { username: "lanhdao", password_hash: passwordHash, full_name: "Lãnh Đạo", role: "leader" },
      { username: "canbo", password_hash: passwordHash, full_name: "CSKV Tổ 1", role: "officer" },
      { username: "khach", password_hash: passwordHash, full_name: "Khách (Tổ trưởng)", role: "guest" },
    ];

    await User.insertMany(users);

    return NextResponse.json({ 
      message: "4 Demo accounts created."
    }, { status: 201 });

  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
