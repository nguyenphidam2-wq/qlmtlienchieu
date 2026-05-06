import connectDB from "../src/lib/mongodb";
import { PCCCRecord } from "../src/lib/models/PCCC";

const tdpCoords: Record<string, [number, number]> = {
  "17": [16.0750, 108.1490],
  "18": [16.0760, 108.1510],
  "19": [16.0770, 108.1530],
  "20": [16.0780, 108.1550],
  "21": [16.0790, 108.1570],
  "22": [16.0800, 108.1590],
  "23": [16.0810, 108.1610]
};

const names = [
  "Trụ nước chữa cháy T17-01",
  "Bể nước dự phòng TDP 18",
  "Trụ nước chữa cháy T19-02",
  "Thiết bị báo cháy Tòa nhà 20",
  "Trụ nước chữa cháy T21-01",
  "Hệ thống bơm cứu hỏa TDP 22",
  "Trụ nước chữa cháy T23-05",
  "Bể nước công cộng TDP 17",
  "Trụ nước chữa cháy T18-03",
  "Thiết bị PCCC Khu dân cư 19"
];

const types = ["hydrant", "water_source", "hydrant", "building", "hydrant", "equipment", "hydrant", "water_source", "hydrant", "equipment"];

async function seed() {
  await connectDB();
  console.log("Connected to DB...");

  const records = [];
  const tdps = ["17", "18", "19", "20", "21", "22", "23"];

  for (let i = 0; i < 10; i++) {
    const tdp = tdps[i % tdps.length];
    const baseCoord = tdpCoords[tdp];
    // Add small random offset
    const lat = baseCoord[0] + (Math.random() - 0.5) * 0.002;
    const lng = baseCoord[1] + (Math.random() - 0.5) * 0.002;

    records.push({
      name: names[i],
      type: types[i],
      status: Math.random() > 0.2 ? "active" : "maintenance",
      address: `Địa bàn Tổ dân phố ${tdp}, Liên Chiểu`,
      lat,
      lng,
      tdp: `Tổ ${tdp}`,
      lastChecked: new Date()
    });
  }

  await PCCCRecord.insertMany(records);
  console.log("Inserted 10 mock PCCC records successfully!");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
