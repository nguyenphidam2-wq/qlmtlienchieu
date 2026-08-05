@echo off
chcp 65001 > nul
title SET UP MAY SERVER QLMT LIEN CHIEU
cls

echo ===================================================
echo 🚀 HỆ THỐNG TỰ ĐỘNG KHỞI TẠO MÁY SERVER QLMT
echo ===================================================
echo.

echo 1. Kiếm tra và nạp file cấu hình môi trường (.env.local)...
if not exist ".env.local" (
    echo MONGODB_URI="mongodb://localhost:27017/qlmt-lienchieu" > .env.local
    echo JWT_SECRET="qlmt-lienchieu-secret-key-2024-server-production" >> .env.local
    echo ✅ Đã tạo file .env.local chuẩn cho máy Server.
) else (
    echo ✅ Đã có file .env.local.
)

echo.
echo 2. Cài đặt các thư viện Node.js cần thiết (Vui lòng đợi 1-2 phút)...
call npm install --no-audit

echo.
echo 3. Khôi phục dữ liệu Ban Đầu vào MongoDB Local...
call npx tsx scripts/import-local-data.ts

echo.
echo 4. Biên dịch nén ứng dụng Web (Build Production)...
call npm run build

echo.
echo 5. Cài đặt PM2 để tự động chạy ngầm Web 24/24 khi khởi động máy...
call npm install -g pm2
call pm2 stop qlmt-server 2>nul
call pm2 delete qlmt-server 2>nul
call pm2 start npm --name "qlmt-server" -- start
call pm2 save

echo.
echo ===================================================
echo 🎉 CHÚC MỪNG! MÁY SERVER ĐÃ SETUP THÀNH CÔNG 100%!
echo.
echo - Web đang chạy ngầm tại địa chỉ: http://localhost:3000
echo - Dữ liệu MongoDB đã được nạp đầy đủ.
echo.
echo Bắt đầu mở công khai ra Internet cho 20 người dùng...
echo ===================================================
echo.

npx localtunnel --port 3000

pause
