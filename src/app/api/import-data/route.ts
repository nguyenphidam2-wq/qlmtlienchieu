import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import { appModules } from "@/features/registry";

// API tạm thời để import data từ local lên Atlas
// Gọi: POST /api/import-data với body { collection: "subjects"|"businesses"|"customzones", data: [...] }
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

    // Tìm module phù hợp từ registry
    const module = appModules.find((m) => m.collectionName === collection);
    if (!module) {
      return NextResponse.json(
        { message: "Collection not supported" },
        { status: 400 }
      );
    }

    const col = mongoose.connection.db!.collection(collection);

    // Thực thi import qua module
    const inserted = await module.importData(col, data);

    return NextResponse.json(
      {
        message: `Imported ${inserted} documents into ${collection}`,
        count: inserted,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message }, { status: 500 });
  }
}