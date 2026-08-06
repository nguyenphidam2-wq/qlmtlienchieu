@echo off
title HỆ THỐNG AUTO UPDATER TỪ GITHUB
echo Dang khoi dong Tram gac Tu dong...
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0AUTO_UPDATER_SERVER.ps1'"
pause
