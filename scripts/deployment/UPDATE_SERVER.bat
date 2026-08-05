@echo off
chcp 65001 > nul
title CAP NHAT CODE TUC THI TU LAPTOP SANG SERVER
cls

echo ===================================================
echo 🔄 DANG CAP NHAT CODE MOI NHAT TU LAPTOP...
echo ===================================================
echo.

echo 1. Tải code mới từ Git...
call git pull

echo.
echo 2. Biên dịch lại ứng dụng...
call npm run build

echo.
echo 3. Khởi động lại Web Server...
call pm2 restart qlmt-server

echo.
echo ===================================================
echo ✅ CẬP NHẬT THÀNH CÔNG! NGƯỜI DÙNG ĐÃ CÓ BẢN MỚI.
echo ===================================================
echo.
pause
