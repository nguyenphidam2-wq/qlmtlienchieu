import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const uri = process.env.MONGODB_URI || '';
  console.log('🔄 Đang kết nối MongoDB để khởi tạo Đợt kiểm tra mẫu...');
  const conn = await mongoose.connect(uri, { dbName: 'qlmt-lienchieu' });
  const db = conn.connection.db;

  // Lấy 8 đối tượng ngẫu nhiên từ DB
  const subjects = await db.collection('subjects').find({ status: { $in: ['Sử dụng', 'Sau cai', 'Nghiện'] } }).limit(8).toArray();
  if (subjects.length === 0) {
    console.error('❌ Không tìm thấy đối tượng nào');
    process.exit(1);
  }

  const { ObjectId } = await import('mongodb');

  const initialSchedule = {
    title: 'Kiểm tra test ma túy định kỳ Tháng 02/2026 - Tổ 23, 24, 25, 27',
    type: 'Periodic',
    test_type: 'UrinaryTest',
    test_location: 'Trụ sở Công an phường Liên Chiểu (Số 374 Nguyễn Lương Bằng)',
    scheduled_date: new Date(Date.now() + 86400000 * 2), // 2 ngày sau
    assigned_officers: ['CSKV Tổ 23-27', 'Cán bộ Y tế CAP'],
    participants: subjects.map((s: any, idx: number) => ({
      _id: new ObjectId(),
      subject_id: s._id,
      full_name: s.full_name,
      status_at_test: s.status || 'Sử dụng',
      tdp: s.tdp || 'Tổ 23',
      result: idx === 0 ? 'Negative' : idx === 1 ? 'Positive' : 'Pending',
      substances_detected: idx === 1 ? ['MET (Ma túy đá)'] : [],
      tested_at: idx < 2 ? new Date() : undefined,
      notes: idx === 0 ? 'Chấp hành thử test đúng giờ, âm tính' : idx === 1 ? 'Phát hiện dương tính qua que thử 4 chân' : '',
    })),
    status: 'In_Progress',
    notes: 'Đợt kiểm tra trọng điểm đầu năm 2026 cho các tổ dân phố phức tạp.',
    created_at: new Date(),
    updated_at: new Date(),
  };

  // Clear old test_schedules if any
  await db.collection('test_schedules').deleteMany({});
  await db.collection('test_schedules').insertOne(initialSchedule);

  console.log(`✅ Đã khởi tạo thành công 01 đợt kiểm tra mẫu với ${subjects.length} đối tượng tham gia!`);
  process.exit(0);
}

main().catch(console.error);
