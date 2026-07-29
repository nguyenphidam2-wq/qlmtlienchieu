import mongoose, { Schema, Document } from "mongoose";

export interface IParticipant {
  subject_id: mongoose.Types.ObjectId | string;
  full_name?: string;
  status_at_test?: string;
  tdp?: string;
  result: "Pending" | "Negative" | "Positive" | "Absent_Excused" | "Absent_Unexcused" | "Refused";
  substances_detected?: string[];
  tested_at?: Date | string;
  notes?: string;
  tested_by?: string;
}

export interface ITestSchedule extends Document {
  title: string;
  type: "Periodic" | "Adhoc" | "CallIn";
  test_type: "UrinaryTest" | "RollCall" | "Interview";
  test_location: string;
  scheduled_date: Date | string;
  assigned_officers?: string[];
  participants: IParticipant[];
  status: "Upcoming" | "In_Progress" | "Completed" | "Cancelled";
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

const ParticipantSchema = new Schema<IParticipant>({
  subject_id: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  full_name: { type: String },
  status_at_test: { type: String },
  tdp: { type: String },
  result: {
    type: String,
    enum: ["Pending", "Negative", "Positive", "Absent_Excused", "Absent_Unexcused", "Refused"],
    default: "Pending",
  },
  substances_detected: [{ type: String }],
  tested_at: { type: Date },
  notes: { type: String },
  tested_by: { type: String },
});

const TestScheduleSchema = new Schema<ITestSchedule>(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["Periodic", "Adhoc", "CallIn"], default: "Periodic" },
    test_type: { type: String, enum: ["UrinaryTest", "RollCall", "Interview"], default: "UrinaryTest" },
    test_location: { type: String, required: true, default: "Trụ sở Công an phường Liên Chiểu" },
    scheduled_date: { type: Date, required: true },
    assigned_officers: [{ type: String }],
    participants: [ParticipantSchema],
    status: { type: String, enum: ["Upcoming", "In_Progress", "Completed", "Cancelled"], default: "Upcoming" },
    notes: { type: String },
    created_by: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

if (process.env.NODE_ENV === "development") {
  if (mongoose.models && mongoose.models.TestSchedule) {
    delete (mongoose.models as any).TestSchedule;
  }
}

export const TestSchedule =
  mongoose.models.TestSchedule || mongoose.model<ITestSchedule>("TestSchedule", TestScheduleSchema);
