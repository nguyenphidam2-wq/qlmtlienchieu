import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

// API tạm thời để import data từ local lên Atlas
// Gọi: POST /api/import-data với body { collection: "subjects"|"customzones", data: [...] }
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { collection, data, secret } = body;

    // Bảo vệ endpoint bằng secret key
    if (secret !== "import-qlmt-2024") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!collection || !Array.isArray(data)) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const allowedCollections = ["subjects", "businesses", "customzones"];
    if (!allowedCollections.includes(collection)) {
      return NextResponse.json({ message: "Collection not allowed" }, { status: 400 });
    }

    const col = mongoose.connection.db!.collection(collection);
    
    // Xóa dữ liệu cũ và insert mới
    await col.deleteMany({});
    let inserted = 0;
    if (data.length > 0) {
      const result = await col.insertMany(data);
      inserted = result.insertedCount;
    }

    return NextResponse.json({ 
      message: `Imported ${inserted} documents into ${collection}`,
      count: inserted
    }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
