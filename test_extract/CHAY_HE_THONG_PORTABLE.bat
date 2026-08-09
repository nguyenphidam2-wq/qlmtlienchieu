@echo off
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
set "CF_CONFIG=%~dp0config\config.yml"

set "NODE_EXE=%BIN_DIR%\node.exe"
set "MONGO_EXE=%BIN_DIR%\mongod.exe"
set "CF_EXE=%BIN_DIR%\cloudflared.exe"

:: 1. KIỂM TRA BỘ THỰC THI PORTABLE
echo [BUỚC 1/4] Kiểm tra các bộ thực thi Portable...
if not exist "%NODE_EXE%" (
    echo [LỖI] Không tìm thấy bin\node.exe!
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
start "QLMT Web Server" /min cmd /k "set PORT=3000 && set HOSTNAME=0.0.0.0 && "%NODE_EXE%" server.js"
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
