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

  // New Personal Info
  job?: string;
  education?: string;
  pathology?: string;
  health_status?: string;

  // Family
  family_members: IFamilyMember[];

  // Drug Classification (Checkbox Array)
  drug_types_used: string[];

  // Residence
  tdp?: string;
  address_permanent?: string;
  address_current?: string;
  
  // Violations
  violation_histories: IViolationHistory[];

  status?: string; // Derived status for map
  is_criminal?: number;
  is_drug?: number;
  is_economic?: number;
  father_name?: string;
  mother_name?: string;
  spouse_name?: string;
  phone_father?: string;
  phone_mother?: string;
  phone_spouse?: string;
  drug_type?: string;
  processing_history?: string;
  criminal_record?: string;
  notes?: string;
  relationships?: string;

  house_image_url?: string;
  subject_images?: string[];

  lat?: number;
  lng?: number;

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
    id_card: { type: String },
    phone: { type: String },
    ethnicity: { type: String, default: "Kinh" },
    face_image_url: { type: String },

    job: { type: String },
    education: { type: String },
    pathology: { type: String },
    health_status: { type: String },

    family_members: { type: [FamilyMemberSchema], default: [] },
    
    drug_types_used: { type: [String], default: [] },

    tdp: { type: String, index: true },
    address_permanent: { type: String },
    address_current: { type: String },

    violation_histories: { type: [ViolationHistorySchema], default: [] },

    status: { type: String, index: true },
    notes: { type: String },
    relationships: { type: String },

    house_image_url: { type: String },
    subject_images: { type: [String] },

    lat: { type: Number },
    lng: { type: Number },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

SubjectSchema.index({ lat: 1, lng: 1 });

export const Subject = mongoose.models.Subject || mongoose.model<ISubject>("Subject", SubjectSchema);