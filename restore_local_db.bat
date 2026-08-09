@echo off
title PHUC HOI DU LIEU TU GOOGLE DRIVE VE LAPTOP
color 0E

echo =======================================================
echo    DONG BO DATA MOI NHAT TU SERVER VE LAPTOP LOCAL
echo =======================================================
echo.

set "GDRIVE_DIR=G:\My Drive\QLMT_Backup"

:: Tim file .archive moi nhat trong Google Drive
for /f "delims=" %%I in ('powershell -Command "Get-ChildItem -Path '%GDRIVE_DIR%\*.archive' | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName"') do set "LATEST_ARCHIVE=%%I"

if "%LATEST_ARCHIVE%"=="" (
    echo [X] LOI: Khong tim thay file .archive nao trong %GDRIVE_DIR%
    pause
    exit /b
)

echo [*] Da tim thay ban sao luu moi nhat: 
echo     %LATEST_ARCHIVE%
echo.
echo [*] Dang lam sach CSDL cu va nap du lieu moi vao Local...
echo [*] Vui long doi trong giay lat...
echo.

:: Chay lenh mongorestore voi co --drop de xoa sach data cu truoc khi nap
mongorestore --uri="mongodb://127.0.0.1:27017" --drop --archive="%LATEST_ARCHIVE%"

if %errorlevel% neq 0 (
    echo.
    echo [X] LOI: Phuc hoi du lieu that bai! Vui long kiem tra lai MongoDB local.
    pause
    exit /b
)

echo.
echo =======================================================
echo [OK] DA PHUC HOI DU LIEU LOCAL THÀNH CONG!
echo Bay gio ban co the code va test voi du lieu that 100%%.
echo =======================================================
pause
