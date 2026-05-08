import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';
import { TDP } from '../src/lib/models/TDP';
import { Subject } from '../src/lib/models/Subject';
import { Business } from '../src/lib/models/Business';
import { PCCCRecord } from '../src/lib/models/PCCC';

const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

// Random utils
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomPhone = () => `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;

const HOS_NAMES = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
const MID_NAMES = ["Văn", "Hữu", "Thị", "Ngọc", "Đình", "Xuân", "Thanh", "Minh", "Hồng", "Hoàng"];
const FIRST_NAMES = ["Anh", "Bình", "Cường", "Dũng", "Em", "Phong", "Giang", "Hải", "Hùng", "Khoa", "Lâm", "Mạnh", "Nam", "Phong", "Quân", "Sơn", "Tài", "Tuấn", "Việt", "Xuân", "Yến", "Lan", "Hoa", "Mai", "Trang", "Nhung"];

const generateName = () => `${randomItem(HOS_NAMES)} ${randomItem(MID_NAMES)} ${randomItem(FIRST_NAMES)}`;

// Business Types
const BIZ_TYPES = ["Karaoke", "Quán Bar", "Khách Sạn", "Nhà Nghỉ", "Cầm Đồ", "Massage", "Quán Nhậu", "Trò Chơi Điện Tử"];
const BIZ_PREFIXES = ["Ánh Sao", "Hoàng Gia", "Sao Đêm", "Hoa Hồng", "Bình Minh", "Phố Biển", "Lien Chieu", "Hồng Phát"];

async function generateMockData() {
    console.log('🚀 Bắt đầu tạo dữ liệu ảo...');
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI is not defined in .env.local');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('✅ Đã kết nối MongoDB');

        // Xóa dữ liệu cũ để tránh trùng lặp nếu chạy nhiều lần
        await Subject.deleteMany({});
        await Business.deleteMany({});
        await PCCCRecord.deleteMany({});
        console.log('🧹 Đã xóa dữ liệu ảo cũ.');

        const tdps = await TDP.find({});
        console.log(`📋 Lấy được ${tdps.length} Tổ dân phố để làm gốc tọa độ.`);

        let subjectCount = 0;
        let bizCount = 0;
        let pcccCount = 0;

        for (const tdp of tdps) {
            let baseLat = 16.07;
            let baseLng = 108.15;

            // Tìm một tọa độ gốc từ ranh giới TDP
            if (tdp.geojson) {
                try {
                    const geo = typeof tdp.geojson === 'string' ? JSON.parse(tdp.geojson) : tdp.geojson;
                    let coords;
                    if (geo.features && geo.features[0] && geo.features[0].geometry) {
                        coords = geo.features[0].geometry.coordinates;
                    } else if (geo.geometry) {
                        coords = geo.geometry.coordinates;
                    }

                    // Đi sâu vào mảng để lấy điểm đầu tiên
                    while (coords && Array.isArray(coords[0])) {
                        coords = coords[0];
                    }

                    if (coords && coords.length >= 2) {
                        baseLng = coords[0];
                        baseLat = coords[1];
                    }
                } catch (e) {
                    console.warn(`Không thể lấy tọa độ gốc cho ${tdp.name}`);
                }
            }

            // Sinh tọa độ ngẫu nhiên xung quanh điểm gốc (bán kính khoảng 10-20m)
            const getOffsetCoord = () => {
                const offsetLat = (Math.random() - 0.5) * 0.0004;
                const offsetLng = (Math.random() - 0.5) * 0.0004;
                return { lat: baseLat + offsetLat, lng: baseLng + offsetLng };
            };

            // 1. Tạo 1-3 Đối tượng ma túy cho mỗi TDP
            const numSubjects = randomInt(1, 3);
            for (let i = 0; i < numSubjects; i++) {
                const coord = getOffsetCoord();
                await Subject.create({
                    full_name: generateName(),
                    dob: `01/01/${randomInt(1970, 2005)}`,
                    gender: Math.random() > 0.3 ? "Nam" : "Nữ",
                    phone: randomPhone(),
                    address_current: `Một địa chỉ thuộc ${tdp.name}`,
                    tdp: tdp.name,
                    lat: coord.lat,
                    lng: coord.lng,
                    status: "Nghiện",
                    approval_status: "Approved"
                });
                subjectCount++;
            }

            // 2. Tạo 1-2 Cơ sở kinh doanh
            const numBiz = randomInt(1, 2);
            for (let i = 0; i < numBiz; i++) {
                const coord = getOffsetCoord();
                const bizType = randomItem(BIZ_TYPES);
                await Business.create({
                    name: `${bizType} ${randomItem(BIZ_PREFIXES)}`,
                    business_type: bizType,
                    address: `Đường số ${randomInt(1, 100)}, ${tdp.name}`,
                    owner_name: generateName(),
                    owner_phone: randomPhone(),
                    risk_level: Math.random() > 0.5 ? "Cao" : "Trung bình",
                    lat: coord.lat,
                    lng: coord.lng,
                    approval_status: "Approved"
                });
                bizCount++;
            }

            // 3. Tạo 1-2 Điểm PCCC
            const numPccc = randomInt(1, 2);
            for (let i = 0; i < numPccc; i++) {
                const coord = getOffsetCoord();
                const pcccType = randomItem(["hydrant", "building", "water_source", "equipment"]);
                let name = "Trụ cứu hỏa";
                if (pcccType === "building") name = "Tòa nhà cao tầng";
                else if (pcccType === "water_source") name = "Bể nước ngầm";
                else if (pcccType === "equipment") name = "Tủ thiết bị PCCC";

                await PCCCRecord.create({
                    name: `${name} - ${tdp.name}`,
                    type: pcccType,
                    status: randomItem(["active", "active", "maintenance"]),
                    address: `Khu vực ${tdp.name}`,
                    tdp: tdp.name,
                    lat: coord.lat,
                    lng: coord.lng,
                });
                pcccCount++;
            }
        }

        console.log(`🎉 Thành công! Đã tạo:`);
        console.log(`- ${subjectCount} Đối tượng ma túy`);
        console.log(`- ${bizCount} Cơ sở kinh doanh`);
        console.log(`- ${pcccCount} Điểm PCCC`);

    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối MongoDB');
    }
}

generateMockData();
