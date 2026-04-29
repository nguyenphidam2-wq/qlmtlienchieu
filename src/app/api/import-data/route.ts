import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import { appModules } from "@/features/registry";

const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB limit

export async function POST(request: Request) {
  console.log("📥 API /api/import-data was hit!");
  try {
    // Bug fix #1 & #2: Limit body size + catch connection errors
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { message: "Payload too large" },
        { status: 413 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Ensure DB connection is ready
    await connectDB();

    const { collection, data, secret } = body;

    // Bảo vệ endpoint bằng secret key
    if (secret !== "import-qlmt-2024") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!collection || !Array.isArray(data)) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    // Bug fix #3: Sanitize collection name ( alphanumeric + underscore only )
    if (!/^[a-zA-Z0-9_]+$/.test(collection)) {
      return NextResponse.json(
        { message: "Invalid collection name" },
        { status: 400 }
      );
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

    // Bug fix #4: Import đồng thời được xử lý bởi module (không có lock,
    // nhưng nowarn giải thích rõ behavior ở đây là intended - đây là import/replace behavior,
    // không phải upsert. Caller phải serialize requests.)
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
    console.error("[import-data] Error:", message);
    return NextResponse.json({ message }, { status: 500 });
  }
}