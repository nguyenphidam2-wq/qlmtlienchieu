import mongoose, { Schema, Document } from "mongoose";
import { FeatureCollection } from "geojson";

export interface IContactPerson {
  full_name: string;
  phone?: string;
  position?: string;
  note?: string;
}

export interface IPartyCell {
  secretary?: IContactPerson;
  deputy_secretary?: IContactPerson;
  committee_members?: IContactPerson[];
  party_members_count?: number;
  female_members_count?: number;
  elderly_members_count?: number;
  retired_armed_forces_count?: number;
  regulation_213_count?: number;
}

export interface IFrontAndOrganizations {
  front_head?: IContactPerson;
  deputy_tdp_leader?: IContactPerson;
  women_union_head?: IContactPerson;
  veterans_union_head?: IContactPerson;
  youth_union_head?: IContactPerson;
  other_organizations?: IContactPerson[];
}

export interface ILocalSecurityForce {
  leader?: IContactPerson;
  deputy_leader?: IContactPerson;
  members?: IContactPerson[];
}

export interface ITDP extends Document {
  name: string;
  households: number;
  population: number;
  area_sqm: number;
  risk_status: "green" | "yellow" | "red";
  color: string;
  geojson: FeatureCollection;
  center?: [number, number];
  leader_name?: string;
  leader_phone?: string;
  secretary_name?: string;
  secretary_phone?: string;
  police_name?: string;
  police_phone?: string;
  boundary_info?: string;
  party_cell?: IPartyCell;
  front_and_organizations?: IFrontAndOrganizations;
  local_security_force?: ILocalSecurityForce;
  approval_status?: "Pending" | "Approved" | "Rejected" | "NeedsUpdate";
  created_by?: string;
  updated_by?: string;
  approved_by?: string;
  approved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const ContactPersonSchema = new Schema<IContactPerson>(
  {
    full_name: { type: String, required: true },
    phone: { type: String },
    position: { type: String },
    note: { type: String },
  },
  { _id: false }
);

const PartyCellSchema = new Schema<IPartyCell>(
  {
    secretary: { type: ContactPersonSchema },
    deputy_secretary: { type: ContactPersonSchema },
    committee_members: { type: [ContactPersonSchema], default: [] },
    party_members_count: { type: Number, default: 0 },
    female_members_count: { type: Number, default: 0 },
    elderly_members_count: { type: Number, default: 0 },
    retired_armed_forces_count: { type: Number, default: 0 },
    regulation_213_count: { type: Number, default: 0 },
  },
  { _id: false }
);

const FrontAndOrganizationsSchema = new Schema<IFrontAndOrganizations>(
  {
    front_head: { type: ContactPersonSchema },
    deputy_tdp_leader: { type: ContactPersonSchema },
    women_union_head: { type: ContactPersonSchema },
    veterans_union_head: { type: ContactPersonSchema },
    youth_union_head: { type: ContactPersonSchema },
    other_organizations: { type: [ContactPersonSchema], default: [] },
  },
  { _id: false }
);

const LocalSecurityForceSchema = new Schema<ILocalSecurityForce>(
  {
    leader: { type: ContactPersonSchema },
    deputy_leader: { type: ContactPersonSchema },
    members: { type: [ContactPersonSchema], default: [] },
  },
  { _id: false }
);

const TDPSchema = new Schema<ITDP>(
  {
    name: { type: String, required: true },
    households: { type: Number, default: 0 },
    population: { type: Number, default: 0 },
    area_sqm: { type: Number, default: 0 },
    risk_status: { type: String, enum: ["green", "yellow", "red"], default: "green" },
    color: { type: String, default: "#3388ff" }, // Default blue
    geojson: { type: Schema.Types.Mixed, required: true },
    center: { type: [Number], required: false }, // [lng, lat] or [lat, lng], usually [lat, lng] for leaflet
    leader_name: { type: String },
    leader_phone: { type: String },
    secretary_name: { type: String },
    secretary_phone: { type: String },
    police_name: { type: String },
    police_phone: { type: String },
    boundary_info: { type: String },
    party_cell: { type: PartyCellSchema },
    front_and_organizations: { type: FrontAndOrganizationsSchema },
    local_security_force: { type: LocalSecurityForceSchema },
    approval_status: { type: String, enum: ["Pending", "Approved", "Rejected", "NeedsUpdate"], default: "Pending", index: true },
    created_by: { type: String },
    updated_by: { type: String },
    approved_by: { type: String },
    approved_at: { type: Date },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const TDP = mongoose.models.TDP || mongoose.model<ITDP>("TDP", TDPSchema);
