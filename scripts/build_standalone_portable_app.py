import os
import shutil
import sys
import zipfile
import subprocess
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

print("========================================================================")
print("  QUY TRÌNH ĐÓNG GÓI PORTABLE HỆ THỐNG QUẢN LÝ ĐỊA BÀN LIÊN CHIỂU")
print("  (KÈM MONGODB PORTABLE + NODE.JS PORTABLE + CLOUDFLARE TUNNEL PORTABLE)")
print("========================================================================")

cwd = os.getcwd()
pkg_dir = os.path.join(cwd, 'QLMT_PORTABLE_APP')
bin_dir = os.path.join(pkg_dir, 'bin')
app_dir = os.path.join(pkg_dir, 'app')
data_dir = os.path.join(pkg_dir, 'data_db')
config_dir = os.path.join(pkg_dir, 'config')

# 1. Clean old package dir
if os.path.exists(pkg_dir):
    print("🧹 Đang dọn dẹp thư mục gói cũ...")
    shutil.rmtree(pkg_dir, ignore_errors=True)

os.makedirs(bin_dir, exist_ok=True)
os.makedirs(app_dir, exist_ok=True)
os.makedirs(data_dir, exist_ok=True)
os.makedirs(config_dir, exist_ok=True)

# 2. Build Next.js Standalone if needed
standalone_src = os.path.join(cwd, '.next', 'standalone')
if not os.path.exists(standalone_src):
    print("⚙️ Đang tiến hành Next.js Build Standalone...")
    subprocess.run(["npm", "run", "build"], shell=True, check=True)

print("📦 Copying Standalone App files...")
for item in os.listdir(standalone_src):
    s = os.path.join(standalone_src, item)
    d = os.path.join(app_dir, item)
    if os.path.isdir(s):
        shutil.copytree(s, d, dirs_exist_ok=True)
    else:
        shutil.copy2(s, d)

# Copy .next/static
static_src = os.path.join(cwd, '.next', 'static')
static_dst = os.path.join(app_dir, '.next', 'static')
if os.path.exists(static_src):
    print("📦 Copying .next/static...")
    shutil.copytree(static_src, static_dst, dirs_exist_ok=True)

# Copy public
public_src = os.path.join(cwd, 'public')
public_dst = os.path.join(app_dir, 'public')
if os.path.exists(public_src):
    print("📦 Copying public folder...")
    shutil.copytree(public_src, public_dst, dirs_exist_ok=True)

# Write .env.local inside app
env_content = """MONGODB_URI=mongodb://127.0.0.1:27017/qlmt-lienchieu
JWT_SECRET=qlmt-lienchieu-secret-key-2026
PORT=3000
HOSTNAME=0.0.0.0
"""
with open(os.path.join(app_dir, '.env.local'), 'w', encoding='utf-8') as f:
    f.write(env_content)

# 3. Locate & Copy Binaries (Node, Mongo, Cloudflared)
print("🔍 Searching for portable binaries on host machine...")

# Node.exe
node_path = shutil.which("node") or r"C:\Program Files\nodejs\node.exe"
if os.path.exists(node_path):
    print(f"  ✓ Found Node.js: {node_path}")
    shutil.copy2(node_path, os.path.join(bin_dir, "node.exe"))

# Cloudflared.exe - download if missing
cf_dst = os.path.join(bin_dir, "cloudflared.exe")
cf_found = False
cf_possible = [
    r"C:\cloudflared\cloudflared.exe",
    os.path.join(cwd, "installers", "cloudflared.exe"),
]
for cp in cf_possible:
    if os.path.exists(cp):
        shutil.copy2(cp, cf_dst)
        print(f"  ✓ Found Cloudflared: {cp}")
        cf_found = True
        break

if not cf_found:
    print("  ⬇️ Cloudflared missing. Downloading latest cloudflared-windows-amd64.exe...")
    try:
        cf_url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
        urllib.request.urlretrieve(cf_url, cf_dst)
        print("  ✓ Downloaded cloudflared.exe successfully!")
    except Exception as e:
        print(f"  ⚠️ Could not download cloudflared.exe: {e}")

# Mongod.exe - search systemic paths
mongo_paths = [
    r"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe",
    r"C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe",
    r"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe",
    r"C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe",
]
found_mongo = False
for mp in mongo_paths:
    if os.path.exists(mp):
        print(f"  ✓ Found MongoDB: {mp}")
        shutil.copy2(mp, os.path.join(bin_dir, "mongod.exe"))
        found_mongo = True
        break

if not found_mongo:
    # Try searching in Program Files for any mongod.exe
    for root, dirs, files in os.walk(r"C:\Program Files\MongoDB"):
        if "mongod.exe" in files:
            mp = os.path.join(root, "mongod.exe")
            print(f"  ✓ Found MongoDB via scan: {mp}")
            shutil.copy2(mp, os.path.join(bin_dir, "mongod.exe"))
            found_mongo = True
            break

if not found_mongo:
    print("  ⚠️ mongod.exe not found on host system.")

# Copy Cloudflare config files if available
cf_user_dir = r"C:\cloudflared"
if os.path.exists(cf_user_dir):
    for f in os.listdir(cf_user_dir):
        if f.endswith(".json") or f.endswith(".yml") or f.endswith(".pem"):
            shutil.copy2(os.path.join(cf_user_dir, f), os.path.join(config_dir, f))

# 4. Copy database backups into package
export_src = os.path.join(cwd, 'scripts', 'export')
data_backup_dst = os.path.join(pkg_dir, 'data_backup')
if os.path.exists(export_src):
    shutil.copytree(export_src, data_backup_dst, dirs_exist_ok=True)

# 5. Create restore_db.js
restore_script = """const fs = require('fs');
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

    console.log('\\n🎉 NẠP DỮ LIỆU ĐỊA BÀN THÀNH CÔNG!');
  } catch (err) {
    console.error('❌ Lỗi nạp CSDL:', err.message);
  } finally {
    await client.close();
  }
}

restore();
"""
with open(os.path.join(app_dir, 'restore_db.js'), 'w', encoding='utf-8') as f:
    f.write(restore_script)

# 6. Master Batch Script CHAY_HE_THONG_PORTABLE.bat
master_bat = """@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
title HỆ THỐNG QUẢN LÝ ĐỊA BÀN & BẢN ĐỒ SỐ - KHỞI CHẠY PORTABLE 1-CLICK
color 0A

echo ========================================================================
echo   HỆ THỐNG QUẢN LÝ ĐỊA BÀN VÀ BẢN ĐỒ SỐ PHƯỜNG LIÊN CHIỂU
echo   PHIÊN BẢN PORTABLE CHẠY 100%% ĐỘC LẬP (KHÔNG CẦN CÀI ĐẶT THƯ VIỆN)
echo ========================================================================
echo.

set "ROOT_DIR=%~dp0"
set "BIN_DIR=%~dp0bin"
set "APP_DIR=%~dp0app"
set "DATA_DB=%~dp0data_db"
set "CF_CONFIG=%~dp0config\\config.yml"

set "NODE_EXE=%BIN_DIR%\\node.exe"
set "MONGO_EXE=%BIN_DIR%\\mongod.exe"
set "CF_EXE=%BIN_DIR%\\cloudflared.exe"

:: 1. KIỂM TRA BỘ THỰC THI PORTABLE
echo [BUỚC 1/4] Kiểm tra các bộ thực thi Portable...
if not exist "%NODE_EXE%" (
    echo [LỖI] Không tìm thấy bin\\node.exe!
    pause
    exit /b
)

:: 2. KHỞI CHẠY MONGODB PORTABLE
echo.
echo [BUỚC 2/4] Đang khởi chạy MongoDB Local (Dữ liệu Offline local)...
if exist "%MONGO_EXE%" (
    start "QLMT MongoDB Local" /min "%MONGO_EXE%" --dbpath="%DATA_DB%" --port 27017 --bind_ip 127.0.0.1
    timeout /t 3 > nul

    echo   -> Tự động kiểm tra và nạp CSDL địa bàn...
    cd /d "%APP_DIR%"
    "%NODE_EXE%" restore_db.js
) else (
    echo [THÔNG BÁO] Không có mongod.exe portable. Hệ thống sẽ dùng CSDL đính kèm hoặc Atlas.
)

:: 3. KHỞI CHẠY NEXT.JS WEB SERVER
echo.
echo [BUỚC 3/4] Đang khởi chạy Web Server Standalone (Port 3000)...
start "QLMT Web Server" /min cmd /k "set PORT=3000&& set HOSTNAME=127.0.0.1&& \"%NODE_EXE%\" server.js"
timeout /t 2 > nul

:: 4. KHỞI CHẠY CLOUDFLARE TUNNEL (KẾT NỐI INTERNET TỰ ĐỘNG)
echo.
echo [BUỚC 4/4] Đang khởi tạo kết nối Internet An Toàn (HTTPS)...

if exist "%CF_EXE%" (
    if exist "%CF_CONFIG%" (
        echo   -> Đang kết nối Tên miền cố định: https://caplienchieu.dpdns.org ...
        start "Cloudflare Tunnel" /min "%CF_EXE%" --config "%CF_CONFIG%" tunnel run
    ) else (
        echo   -> Đang phát đường truyền Cloudflare Quick Tunnel ngẫu nhiên...
        start "Cloudflare Tunnel" /min "%CF_EXE%" tunnel --url http://127.0.0.1:3000
    )
) else (
    echo [THÔNG BÁO] Không có Cloudflared. Hệ thống hoạt động tại http://127.0.0.1:3000
)

timeout /t 3 > nul
start http://127.0.0.1:3000

echo.
echo ========================================================================
echo 🎉 HỆ THỐNG ĐÃ KHỞI CHẠY THÀNH CÔNG!
echo.
echo 📌 Truy cập tại máy này: http://127.0.0.1:3000
echo 📌 Truy cập từ xa (Internet): https://caplienchieu.dpdns.org
echo ========================================================================
echo.
pause
"""

with open(os.path.join(pkg_dir, 'CHAY_HE_THONG_PORTABLE.bat'), 'w', encoding='utf-8') as f:
    f.write(master_bat)

print(f"✅ Đóng gói hoàn tất thư mục: {pkg_dir}")

# 7. Zip package
zip_path = os.path.join(cwd, 'QLMT_PORTABLE_APP.zip')
print(f"🗜️ Đang nén file {zip_path}...")
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, allowZip64=True) as zipf:
    for root, dirs, files in os.walk(pkg_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, pkg_dir)
            zipf.write(full_path, rel_path)

print(f"🎉 TẢI THÀNH CÔNG GÓI PORTABLE TẠI: {zip_path}")
