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

  father_name?: string;
  mother_name?: string;
  spouse_name?: string;
  phone_father?: string;
  phone_mother?: string;
  phone_spouse?: string;

  is_criminal: number;
  is_drug: number;
  is_economic: number;

  tdp?: string;
  address_permanent: string;
  address_current?: string;

  status?: string;
  drug_type?: string;
  processing_history?: string;
  criminal_record?: string;
  relationships?: string;
  notes?: string;

  house_image_url?: string;
  subject_images?: string[];

  lat?: number;
  lng?: number;

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