"use server";

import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadFile(
  formData: FormData,
  folder: string = "uploads"
): Promise<string | null> {
  try {
    const file = formData.get("file") as File;
    if (!file) return null;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`);
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      throw new Error("File too large. Max size is 10MB");
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", folder);
    await mkdir(uploadDir, { recursive: true });

    // Clean filename - only allow alphanumeric, dash, underscore, dot
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${cleanName}`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    return `/${folder}/${filename}`;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}

export async function uploadMultipleFiles(
  formData: FormData,
  folder: string = "uploads"
): Promise<string[]> {
  const files = formData.getAll("files") as File[];
  const urls: string[] = [];

  for (const file of files) {
    const fd = new FormData();
    fd.append("file", file);
    const url = await uploadFile(fd, folder);
    if (url) urls.push(url);
  }

  return urls;
}

// Delete a file by URL
export async function deleteFile(fileUrl: string): Promise<boolean> {
  try {
    // Remove leading slash
    const filepath = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
    const fullPath = path.join(process.cwd(), "public", filepath);

    // Security check - ensure path is within public directory
    const publicDir = path.join(process.cwd(), "public");
    if (!fullPath.startsWith(publicDir)) {
      throw new Error("Invalid file path");
    }

    await unlink(fullPath);
    return true;
  } catch (error) {
    console.error("Delete file error:", error);
    return false;
  }
}