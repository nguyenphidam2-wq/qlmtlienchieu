const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

async function restore() {
  console.log('🔄 Đang kết nối tới MongoDB Local (127.0.0.1:27017)...');
  const client = new MongoClient('mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 5000 });
  
  try {
    await client.connect();
    const db = client.db('qlmt-lienchieu');
    console.log('✅ Đã kết nối CSDL Local.');

    const subPath = path.join(__dirname, '..', 'data_backup', 'subjects.json');
    if (fs.existsSync(subPath)) {
      console.log('  -> Nạp dữ liệu Đối tượng ma túy...');
      const subjects = JSON.parse(fs.readFileSync(subPath, 'utf8'));
      const coll = db.collection('subjects');
      await coll.drop().catch(() => {});
      if (subjects.length > 0) await coll.insertMany(subjects);
      await coll.createIndex({ id_card: 1 });
      await coll.createIndex({ tdp: 1 });
      console.log(`  ✓ Đã nạp ${subjects.length} Đối tượng ma túy.`);
    }

    const zonePath = path.join(__dirname, '..', 'data_backup', 'customzones.json');
    if (fs.existsSync(zonePath)) {
      console.log('  -> Nạp dữ liệu Vùng Custom Zones...');
      const zones = JSON.parse(fs.readFileSync(zonePath, 'utf8'));
      const coll = db.collection('customzones');
      await coll.drop().catch(() => {});
      if (zones.length > 0) await coll.insertMany(zones);
      console.log(`  ✓ Đã nạp ${zones.length} Vùng bản đồ số.`);
    }

    console.log('\n🎉 NẠP DỮ LIỆU ĐỊA BÀN THÀNH CÔNG!');
  } catch (err) {
    console.error('❌ Lỗi nạp CSDL:', err.message);
  } finally {
    await client.close();
  }
}

restore();
