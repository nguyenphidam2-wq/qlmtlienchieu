const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const template = [
  {
    "name": "Tổ dân phố 1",
    "households": 120,
    "population": 450,
    "area_sqm": 15000,
    "risk_status": "Xanh",
    "color": "#00e676",
    "leader_name": "Nguyễn Văn A",
    "leader_phone": "0905123456",
    "geojson": '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[108.14,16.06],[108.15,16.06],[108.15,16.07],[108.14,16.07],[108.14,16.06]]]},"properties":{}}]}'
  },
  {
    "name": "Tổ dân phố 2",
    "households": 95,
    "population": 380,
    "area_sqm": 12000,
    "risk_status": "Vàng",
    "color": "#ffb300",
    "leader_name": "Trần Thị B",
    "leader_phone": "0905987654",
    "geojson": ""
  }
];

const ws = XLSX.utils.json_to_sheet(template);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Template TDP");

const publicDir = path.resolve(__dirname, "../public");
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

const filePath = path.join(publicDir, "Mau_Nhap_Lieu_TDP.xlsx");
XLSX.writeFile(wb, filePath);

console.log(`✅ Đã tạo file mẫu thành công tại: ${filePath}`);
