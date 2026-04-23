/**
 * Data Migration Script
 *
 * This script migrates data from the old SQLite database (sql_app.db) to MongoDB.
 *
 * Usage:
 *   npx tsx scripts/migrate-data.ts
 *
 * Prerequisites:
 *   1. Make sure MongoDB is running
 *   2. Update .env.local with your MongoDB URI
 *   3. Keep the old sql_app.db file in the project root
 */

import { readFileSync, existsSync } from "fs";
import path from "path";

// We'll use dynamic imports to handle both SQLite and MongoDB
// This script demonstrates the structure for migrating data

interface OldSubject {
  id: number;
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
  subject_images?: string;
  lat?: number;
  lng?: number;
}

interface OldBusiness {
  id: number;
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
}

async function migrateData() {
  console.log("Starting data migration...");
  console.log("=" .repeat(50));

  // Check if old database exists
  const dbPath = path.join(process.cwd(), "..", "sql_app.db");
  const oldDbExists = existsSync(dbPath);

  if (!oldDbExists) {
    console.log("⚠️  Old SQLite database (sql_app.db) not found in project root.");
    console.log("   If you have data in Supabase, you'll need to export it manually.");
    console.log("   Migration can still create the MongoDB schemas.");
  }

  // Import mongoose dynamically
  const mongoose = await import("mongoose");
  const { connectDB } = await import("../src/lib/mongodb");
  const { Subject, Business } = await import("../src/lib/models");

  // Get MongoDB URI
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/qlmt-lienchieu";

  try {
    // Connect to MongoDB
    console.log(`\n📦 Connecting to MongoDB: ${mongoUri}`);
    await connectDB();
    console.log("✅ Connected to MongoDB\n");

    // If old database exists, migrate the data
    if (oldDbExists) {
      console.log("📂 Found old SQLite database. Reading data...");

      // Read the SQLite database using better-sqlite3
      const Database = (await import("better-sqlite3")).default;
      const db = new Database(dbPath, { readonly: true });

      // Migrate Subjects
      console.log("\n👥 Migrating Subjects...");
      const oldSubjects: OldSubject[] = db.prepare("SELECT * FROM subjects").all() as OldSubject[];

      if (oldSubjects.length > 0) {
        const subjectDocs = oldSubjects.map((s) => ({
          full_name: s.full_name,
          alias: s.alias,
          dob: s.dob,
          yob: s.yob,
          gender: s.gender,
          id_card: s.id_card,
          phone: s.phone,
          ethnicity: s.ethnicity || "Kinh",
          face_image_url: s.face_image_url,
          father_name: s.father_name,
          mother_name: s.mother_name,
          spouse_name: s.spouse_name,
          phone_father: s.phone_father,
          phone_mother: s.phone_mother,
          phone_spouse: s.phone_spouse,
          is_criminal: s.is_criminal || 0,
          is_drug: s.is_drug || 0,
          is_economic: s.is_economic || 0,
          tdp: s.tdp,
          address_permanent: s.address_permanent,
          address_current: s.address_current,
          status: s.status,
          drug_type: s.drug_type,
          processing_history: s.processing_history,
          criminal_record: s.criminal_record,
          relationships: s.relationships,
          notes: s.notes,
          house_image_url: s.house_image_url,
          subject_images: s.subject_images ? JSON.parse(s.subject_images) : [],
          lat: s.lat,
          lng: s.lng,
        }));

        await Subject.insertMany(subjectDocs);
        console.log(`   ✅ Migrated ${oldSubjects.length} subjects`);
      } else {
        console.log("   ℹ️  No subjects found in old database");
      }

      // Migrate Businesses
      console.log("\n🏪 Migrating Businesses...");
      const oldBusinesses: OldBusiness[] = db.prepare("SELECT * FROM businesses").all() as OldBusiness[];

      if (oldBusinesses.length > 0) {
        const businessDocs = oldBusinesses.map((b) => ({
          name: b.name,
          business_type: b.business_type,
          address: b.address,
          address_detail: b.address_detail,
          owner_name: b.owner_name,
          owner_phone: b.owner_phone,
          owner_id_card: b.owner_id_card,
          license_number: b.license_number,
          operation_hours: b.operation_hours,
          num_staff: b.num_staff || 0,
          risk_level: b.risk_level || "Trung bình",
          inspection_count: b.inspection_count || 0,
          last_inspection: b.last_inspection,
          violations: b.violations,
          notes: b.notes,
          lat: b.lat,
          lng: b.lng,
        }));

        await Business.insertMany(businessDocs);
        console.log(`   ✅ Migrated ${oldBusinesses.length} businesses`);
      } else {
        console.log("   ℹ️  No businesses found in old database");
      }

      db.close();
    } else {
      console.log("\n⚠️  Skipping old data migration (no source database found)");
    }

    // Verify migration
    const subjectCount = await Subject.countDocuments();
    const businessCount = await Business.countDocuments();

    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Summary:");
    console.log(`   Subjects in MongoDB: ${subjectCount}`);
    console.log(`   Businesses in MongoDB: ${businessCount}`);
    console.log("\n✅ Migration completed successfully!");

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await mongoose.default.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run migration
migrateData().catch(console.error);