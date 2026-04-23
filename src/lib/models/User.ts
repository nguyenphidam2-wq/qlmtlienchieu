import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  password_hash: string;
  full_name: string;
  role: "admin" | "leader" | "officer" | "guest";
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true },
    role: { 
      type: String, 
      enum: ["admin", "leader", "officer", "guest"],
      default: "guest" 
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
