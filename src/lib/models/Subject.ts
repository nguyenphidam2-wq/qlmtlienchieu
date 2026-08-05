import mongoose, { Schema, Document } from "mongoose";

export interface IFamilyMember {
  full_name: string;
  relation: string;
  yob?: string;
  address?: string;
  phone?: string;
}

export interface IViolationHistory {
  action: string;
  date: string;
  decision_num_date: string;
  duration: string;
}

export interface IVehicle {
  vehicle_type?: string;
  license_plate?: string;
  brand_color?: string;
}

export interface IAttachedFile {
  file_name: string;
  file_url: string;
  file_type?: string;
  uploaded_at: Date;
}

export interface ISubject extends Document {
  full_name: string;
  alias?: string;
  dob?: string;
  yob?: number;
  gender?: string;
  id_card?: string;
  phone?: string;
  ethnicity?: string;
  face_image_url?: string;

  job?: string;
  education?: string;
  residence_status?: "Permanent" | "Temporary" | "Absent" | "Unknown";
  pathology?: string;
  health_status?: string;

  // Family
  family_members: IFamilyMember[];

  // Drug & Medical Classification
  drug_types_used: string[];
  consumption_method?: string[];
  addiction_date?: string;
  is_methadone_treatment?: boolean;
  methadone_facility?: string;
  latest_test_result?: {
    date?: string;
    result?: "Negative" | "Positive" | "Refused" | "Pending";
    substances?: string[];
  };

  // Residence
  tdp?: string;
  address_permanent?: string;
  address_current?: string;
  lat?: number;
  lng?: number;

  // Violations & Legal
  violation_histories: IViolationHistory[];
  convictions_count?: number;
  priors_count?: number;
  criminal_record?: string;
  processing_history?: string;
  notes?: string;
  relationships?: string;

  status?: string; // Derived status for map
  risk_level?: "red" | "yellow" | "green";
  is_criminal?: number;
  is_drug?: number;
  is_economic?: number;

  // Officer in charge
  assigned_officer_id?: string;
  assigned_officer_name?: string;

  // Media & Files
  house_image_url?: string;
  subject_images?: string[];
  registered_vehicles?: IVehicle[];
  attached_files?: IAttachedFile[];

  // Approval workflow
  approval_status?: "Pending" | "Approved";
  created_by?: string;
  approved_by?: string;
  approved_at?: Date;

  created_at: Date;
  updated_at: Date;
}

const FamilyMemberSchema = new Schema<IFamilyMember>({
  full_name: { type: String, required: true },
  relation: { type: String },
  yob: { type: String },
  address: { type: String },
  phone: { type: String }
});

const ViolationHistorySchema = new Schema<IViolationHistory>({
  action: { type: String, required: true },
  date: { type: String },
  decision_num_date: { type: String },
  duration: { type: String }
});

const SubjectSchema = new Schema<ISubject>(
  {
    full_name: { type: String, required: true, index: true },
    alias: { type: String },
    dob: { type: String },
    yob: { type: Number },
    gender: { type: String },
    id_card: { type: String, index: true },
    phone: { type: String },
    ethnicity: { type: String, default: "Kinh" },
    face_image_url: { type: String },

    job: { type: String },
    education: { type: String },
    residence_status: { type: String, enum: ["Permanent", "Temporary", "Absent", "Unknown"], default: "Permanent" },
    pathology: { type: String },
    health_status: { type: String },

    family_members: { type: [FamilyMemberSchema], default: [] },

    drug_types_used: { type: [String], default: [] },
    consumption_method: { type: [String], default: [] },
    addiction_date: { type: String },
    is_methadone_treatment: { type: Boolean, default: false },
    methadone_facility: { type: String },
    latest_test_result: {
      date: { type: String },
      result: { type: String, enum: ["Negative", "Positive", "Refused", "Pending"] },
      substances: { type: [String], default: [] }
    },

    tdp: { type: String, index: true },
    address_permanent: { type: String },
    address_current: { type: String },
    lat: { type: Number },
    lng: { type: Number },

    violation_histories: { type: [ViolationHistorySchema], default: [] },
    convictions_count: { type: Number, default: 0 },
    priors_count: { type: Number, default: 0 },
    criminal_record: { type: String },
    processing_history: { type: String },
    notes: { type: String },
    relationships: { type: String },

    status: { type: String, index: true },
    risk_level: { type: String, enum: ["red", "yellow", "green"], default: "green", index: true },
    is_criminal: { type: Number, default: 0 },
    is_drug: { type: Number, default: 1 },
    is_economic: { type: Number, default: 0 },

    assigned_officer_id: { type: String, index: true },
    assigned_officer_name: { type: String },

    house_image_url: { type: String },
    subject_images: { type: [String], default: [] },
    registered_vehicles: [
      {
        vehicle_type: String,
        license_plate: String,
        brand_color: String
      }
    ],
    attached_files: [
      {
        file_name: String,
        file_url: String,
        file_type: String,
        uploaded_at: { type: Date, default: Date.now }
      }
    ],

    // Approval workflow fields
    approval_status: { type: String, enum: ["Pending", "Approved"], default: "Pending", index: true },
    created_by: { type: String },
    approved_by: { type: String },
    approved_at: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

SubjectSchema.index({ tdp: 1, status: 1 });
SubjectSchema.index({ "registered_vehicles.license_plate": 1 });

if (process.env.NODE_ENV === "development") {
  if (mongoose.models && mongoose.models.Subject) {
    delete (mongoose.models as any).Subject;
  }
  if (mongoose.connection && mongoose.connection.models && mongoose.connection.models.Subject) {
    delete (mongoose.connection.models as any).Subject;
  }
  if (mongoose.connections) {
    mongoose.connections.forEach((conn) => {
      if (conn.models && conn.models.Subject) {
        delete (conn.models as any).Subject;
      }
    });
  }
}

export const Subject = mongoose.models.Subject || mongoose.model<ISubject>("Subject", SubjectSchema);