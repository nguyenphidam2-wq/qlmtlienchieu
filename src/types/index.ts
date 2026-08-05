export interface FamilyMember {
  full_name: string;
  relation: string;
  yob?: string;
  address?: string;
  phone?: string;
}

export interface ViolationHistory {
  action: string;
  date: string;
  decision_num_date: string;
  duration: string;
}

export interface Vehicle {
  vehicle_type?: string;
  license_plate?: string;
  brand_color?: string;
}

export interface AttachedFile {
  file_name: string;
  file_url: string;
  file_type?: string;
  uploaded_at: Date;
}

export interface Subject {
  _id?: string;
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

  family_members?: FamilyMember[];

  drug_types_used?: string[];
  consumption_method?: string[];
  addiction_date?: string;
  is_methadone_treatment?: boolean;
  methadone_facility?: string;
  latest_test_result?: {
    date?: string;
    result?: "Negative" | "Positive" | "Refused" | "Pending";
    substances?: string[];
  };

  is_criminal?: number;
  is_drug?: number;
  is_economic?: number;

  tdp?: string;
  address_permanent?: string;
  address_current?: string;
  lat?: number;
  lng?: number;

  status?: string;
  risk_level?: "red" | "yellow" | "green";
  violation_histories?: ViolationHistory[];
  convictions_count?: number;
  priors_count?: number;
  criminal_record?: string;
  processing_history?: string;
  notes?: string;
  relationships?: string;

  assigned_officer_id?: string;
  assigned_officer_name?: string;

  house_image_url?: string;
  subject_images?: string[];
  registered_vehicles?: Vehicle[];
  attached_files?: AttachedFile[];

  approval_status?: "Pending" | "Approved";
  created_by?: string;
  approved_by?: string;
  approved_at?: Date;

  created_at?: Date;
  updated_at?: Date;
}

export interface Business {
  _id?: string;
  name: string;
  business_type: string;
  address: string;
  address_detail?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_id_card?: string;
  license_number?: string;
  operation_hours?: string;
  num_staff?: number;
  risk_level: string;
  inspection_count: number;
  last_inspection?: string;
  violations?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Stats {
  total_subjects: number;
  total_businesses: number;
  status_counts: Record<string, number>;
  tdp_stats: Record<string, number>;
}

export type SubjectStatus = "Nghiện" | "Sử dụng" | "Sau cai" | "Khởi tố";
export type RiskLevel = "Thấp" | "Trung bình" | "Cao" | "Rất cao";
export type BusinessType = "Karaoke" | "Nhà nghỉ" | "Pub/Bar" | "Tiệm cầm đồ" | "Quán bia/nhậu" | "Vũ trường" | "Khác";