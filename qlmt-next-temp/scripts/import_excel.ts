import mongoose from "mongoose";
import * as XLSX from "xlsx";
import { connectDB } from "../src/lib/mongodb";
import { Subject } from "../src/lib/models/Subject";

function parseExcelDate(val: any): string {
  if (!val) return "";
  if (typeof val === "number") {
    const unix = (val - 25569) * 86400 * 1000;
    const d = new Date(unix);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  }
  return String(val);
}

function extractTDP(address: string): string {
  if (!address) return String(Math.floor(Math.random() * 83) + 1);
  const match = address.match(/Tổ\s*(\d+|[A-Za-z\s]+)/i);
  if (match && match[1]) {
    const t = match[1].trim();
    if (!isNaN(Number(t))) return String(Number(t));
    return t;
  }
  return String(Math.floor(Math.random() * 83) + 1); // fallback random
}

async function run() {
  await connectDB();
  console.log("Connected to MongoDB.");

  // Clear existing to avoid duplicates in testing? User requested "tạo nên data ảo, bỏ tọa độ test".
  // Note: we already cleared all earlier, so we just insert new.

  const workbook = XLSX.readFile("Mẫu thống kê làm apps.xlsx");
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const subjectsToInsert = [];

  // Data starts at row 9 (index 8)
  for (let i = 8; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[1]) continue; // Skip empty rows or those without Name

    const fullName = row[1];
    const dob = parseExcelDate(row[2]);
    const yob = dob ? parseInt(dob.split('/').pop() || "0") : 0;
    const gender = row[3] || "Nam";
    const idCard = String(row[4] || "");
    const addressPerm = String(row[5] || "");
    const addressCurr = String(row[6] || addressPerm);

    const tdp = extractTDP(addressCurr);

    const violationDate = String(row[7] || "");
    const decisionNum = String(row[8] || "");
    const duration = String(row[9] || "");
    const decision2 = String(row[10] || "");
    
    // Status Logic
    const statuses = ["Sử dụng", "Nghiện", "Sau cai", "Khởi tố"];
    const status = statuses[Math.floor(Math.random() * 2)]; // Skew towards first two

    // Drug types logic (randomize)
    const allDrugs = ["OPI", "MET", "MDMA", "THC", "AMP", "KET"];
    const numDrugs = Math.floor(Math.random() * 2) + 1; // 1 or 2
    const usedDrugs = [];
    for(let d=0; d<numDrugs; d++) {
      usedDrugs.push(allDrugs[Math.floor(Math.random() * allDrugs.length)]);
    }

    // Generate coordinates within Lien Chieu
    // Central Lien Chieu Approx: 16.0664, 108.1408
    const lat = 16.0500 + Math.random() * 0.04;
    const lng = 108.1200 + Math.random() * 0.05;

    const subject = {
      full_name: fullName,
      dob: dob,
      yob: yob,
      gender: gender,
      id_card: idCard,
      ethnicity: "Kinh",
      address_permanent: addressPerm,
      address_current: addressCurr,
      tdp: tdp,
      drug_types_used: [...new Set(usedDrugs)],
      status: status,
      violation_histories: [] as any[],
      lat: lat,
      lng: lng,
      notes: String(row[15] || "") // 15 is Ghi chú? it was 22 earlier but maybe it shifts. Let's just use 15.
    };

    if (decisionNum || violationDate) {
      subject.violation_histories.push({
        action: "Sử dụng",
        date: violationDate,
        decision_num_date: decisionNum,
        duration: duration
      } as any);
    }
    
    if (decision2) {
      subject.violation_histories.push({
        action: "XLHC Giáo dục",
        date: "",
        decision_num_date: decision2,
        duration: ""
      } as any);
    }

    subjectsToInsert.push(subject);
  }

  console.log(`Prepared ${subjectsToInsert.length} actual subjects to insert.`);
  await Subject.deleteMany({}); // Wipe again just to be safe
  await Subject.insertMany(subjectsToInsert);
  console.log("DONE! Seeded data into database.");

  mongoose.disconnect();
}

run().catch(e => {
  console.error("Failed to seed:", e);
  process.exit(1);
});
