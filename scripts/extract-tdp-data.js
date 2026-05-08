const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

// 1. Đọc tệp HTML
const htmlPath = path.resolve(__dirname, "../public/Xem_Ban_Do_Sat_Nhap.html");
const htmlContent = fs.readFileSync(htmlPath, "utf-8");

// 2. Trích xuất biến 'data' bằng Regex
const match = htmlContent.match(/const data = ({.*?});/s);
if (!match) {
    console.error("❌ Không tìm thấy dữ liệu 'data' trong file HTML!");
    process.exit(1);
}

const geojson = JSON.parse(match[1]);
const features = geojson.features;

// 3. Hàm phân loại và lấy số để sắp xếp
function getSortKey(name) {
    name = name.toLowerCase();
    
    // Ưu tiên 1: Tổ dân phố số (1-83)
    if (name.includes("tổ dân phố") || name.includes("tổ ")) {
        const numMatch = name.match(/\d+/);
        if (numMatch) return { type: 1, value: parseInt(numMatch[0]) };
    }
    
    // Ưu tiên 2: Quan Nam (1-6)
    if (name.includes("quan nam")) {
        const numMatch = name.match(/\d+/);
        if (numMatch) return { type: 2, value: parseInt(numMatch[0]) };
        return { type: 2, value: 0 };
    }
    
    // Các vùng đặc biệt khác
    return { type: 3, value: name };
}

// 4. Sắp xếp danh sách
features.sort((a, b) => {
    const keyA = getSortKey(a.properties.name || "");
    const keyB = getSortKey(b.properties.name || "");
    
    if (keyA.type !== keyB.type) return keyA.type - keyB.type;
    if (typeof keyA.value === "number" && typeof keyB.value === "number") {
        return keyA.value - keyB.value;
    }
    return String(keyA.value).localeCompare(String(keyB.value));
});

// 5. Hàm tối ưu hóa GeoJSON (làm tròn tọa độ để giảm độ dài chuỗi)
function optimizeGeometry(geom) {
    if (!geom || !geom.coordinates) return geom;
    
    const round = (num) => Math.round(num * 1000000) / 1000000;
    
    const processCoords = (coords) => {
        if (Array.isArray(coords[0])) {
            return coords.map(processCoords);
        }
        return [round(coords[0]), round(coords[1])];
    };

    return {
        ...geom,
        coordinates: processCoords(geom.coordinates)
    };
}

// 6. Ánh xạ dữ liệu sang định dạng Excel
const excelData = features.map(f => {
    const props = f.properties;
    
    // Tối ưu hóa hình học
    const optimizedGeom = optimizeGeometry(f.geometry);

    // Tạo FeatureCollection riêng cho từng row
    const singleGeoJSON = {
        type: "FeatureCollection",
        features: [{
            type: "Feature",
            geometry: optimizedGeom,
            properties: {}
        }]
    };

    let geojsonStr = JSON.stringify(singleGeoJSON);
    
    // Kiểm tra giới hạn ký tự của Excel (32,767)
    if (geojsonStr.length > 32700) {
        console.warn(`⚠️ Cảnh báo: Dữ liệu tọa độ của "${props.name}" quá lớn (${geojsonStr.length} ký tự). Đã tạm thời để trống để tránh lỗi file.`);
        geojsonStr = ""; 
    }

    return {
        "name": props.name || "Chưa đặt tên",
        "households": parseInt(props.ho) || 0,
        "population": parseInt(props.khau) || 0,
        "area_sqm": 0,
        "risk_status": "Bình thường",
        "color": "#3b82f6",
        "leader_name": "",
        "leader_phone": "",
        "geojson": geojsonStr
    };
});

// 6. Ghi ra file Excel
const ws = XLSX.utils.json_to_sheet(excelData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Danh sach TDP");

const outputPath = path.resolve(__dirname, "../public/Mau_Nhap_Lieu_TDP_Chuan.xlsx");
XLSX.writeFile(wb, outputPath);

console.log(`✅ Đã trích xuất ${excelData.length} tổ dân phố.`);
console.log(`📂 File đã sẵn sàng tại: ${outputPath}`);
