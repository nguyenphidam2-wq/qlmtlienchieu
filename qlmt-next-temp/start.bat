@echo off
title QLMT Lien Chieu - Dev Server
color 0A

echo ========================================
echo   KHOI Dong Server QLMT Lien Chieu
echo ========================================
echo.

cd /d "%~dp0"

echo Dang khoi dong server...
start http://localhost:3000
npm run dev

pause