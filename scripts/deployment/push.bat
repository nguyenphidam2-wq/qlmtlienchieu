@echo off
title Git Push Quick Sync
color 0B

echo ========================================
echo   DONG BO CODE LEN GITHUB
echo ========================================
echo.

:: Kiem tra trang thai file
git status

echo.
set /p msg="Nhap noi dung thay doi (Commit message): "

if "%msg%"=="" (
    set msg="Update project"
)

echo.
echo Dang thuc hien: git add .
git add .

echo.
echo Dang thuc hien: git commit -m "%msg%"
git commit -m "%msg%"

echo.
echo Dang thuc hien: git push origin main
git push origin main

echo.
echo ========================================
echo   HOAN TAT!
echo ========================================
pause
