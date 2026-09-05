<#
.SYNOPSIS
    Script sao lưu cơ sở dữ liệu MongoDB và tệp tin đính kèm cho hệ thống QLMT.
.DESCRIPTION
    1. Trích xuất database MongoDB từ container qua mongodump (--archive --gzip).
    2. Nén thư mục uploads (nếu có).
    3. Lưu trữ tại thư mục backups cục bộ và tự động duy trì 7 bản gần nhất.
    4. Tùy chọn đồng bộ mã hóa lên Google Drive qua rclone crypt nếu có cấu hình.
#>

[CmdletBinding()]
param (
    [string]$BackupDir = "D:\QLMT\backups",
    [string]$ContainerName = "qlmt-mongo",
    [string]$DatabaseName = "qlmt-lienchieu",
    [int]$KeepLocalCount = 7,
    [string]$RcloneRemote = "" # Ví dụ: "gdrive-secure:qlmt-backups"
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param ([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN"  { "Yellow" }
        "SUCCESS" { "Green" }
        default { "Cyan" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

try {
    Write-Log "Bắt đầu quy trình sao lưu hệ thống QLMT..."

    # 1. Khởi tạo thư mục backup nếu chưa tồn tại
    if (-not (Test-Path $BackupDir)) {
        New-Item -Path $BackupDir -ItemType Directory -Force | Out-Null
        Write-Log "Đã tạo thư mục lưu trữ: $BackupDir"
    }

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $archiveName = "qlmt_backup_$timestamp"
    $targetDir = Join-Path $BackupDir $archiveName
    New-Item -Path $targetDir -ItemType Directory -Force | Out-Null

    # 2. Sao lưu MongoDB
    $dbBackupFile = Join-Path $targetDir "mongodb_$timestamp.gz"
    Write-Log "Đang trích xuất database MongoDB từ container [$ContainerName]..."

    # Kiểm tra container có đang chạy không
    $containerRunning = docker ps --filter "name=$ContainerName" --filter "status=running" --format "{{.Names}}"
    if (-not $containerRunning) {
        throw "Container [$ContainerName] không hoạt động. Vui lòng kiểm tra Docker."
    }

    # Chạy mongodump trực tiếp qua docker exec
    docker exec $ContainerName mongodump --db $DatabaseName --archive --gzip > $dbBackupFile
    if (-not (Test-Path $dbBackupFile) -or (Get-Item $dbBackupFile).Length -eq 0) {
        throw "Tạo bản sao lưu MongoDB thất bại hoặc file rỗng."
    }
    $dbSizeMB = [math]::Round((Get-Item $dbBackupFile).Length / 1MB, 2)
    Write-Log "Sao lưu MongoDB thành công: $dbBackupFile ($dbSizeMB MB)" -Level "SUCCESS"

    # 3. Sao lưu thư mục Uploads từ container hoặc volume
    $uploadsBackupFile = Join-Path $targetDir "uploads_$timestamp.zip"
    $projectRoot = Split-Path -Parent $PSScriptRoot
    $localUploads = Join-Path $projectRoot "public\uploads"

    Write-Log "Đang kiểm tra dữ liệu tệp tin đính kèm uploads..."
    if (Test-Path $localUploads) {
        Compress-Archive -Path "$localUploads\*" -DestinationPath $uploadsBackupFile -Force -ErrorAction SilentlyContinue
        if (Test-Path $uploadsBackupFile) {
            $uploadsSizeMB = [math]::Round((Get-Item $uploadsBackupFile).Length / 1MB, 2)
            Write-Log "Đã nén tệp tin uploads: $uploadsBackupFile ($uploadsSizeMB MB)" -Level "SUCCESS"
        }
    } else {
        # Thử sao lưu từ volume docker nếu thư mục local trống
        try {
            docker cp qlmt-web:/app/public/uploads "$targetDir\uploads_raw" 2>$null
            if (Test-Path "$targetDir\uploads_raw") {
                Compress-Archive -Path "$targetDir\uploads_raw\*" -DestinationPath $uploadsBackupFile -Force
                Remove-Item -Path "$targetDir\uploads_raw" -Recurse -Force
                Write-Log "Đã sao lưu uploads từ container web." -Level "SUCCESS"
            }
        } catch {
            Write-Log "Không tìm thấy thư mục uploads hoặc chưa có tệp đính kèm." -Level "WARN"
        }
    }

    # 4. Tạo gói tổng hợp nén
    $finalZipFile = Join-Path $BackupDir "$archiveName.zip"
    Write-Log "Đang đóng gói toàn bộ bản backup thành: $finalZipFile"
    Compress-Archive -Path "$targetDir\*" -DestinationPath $finalZipFile -Force
    Remove-Item -Path $targetDir -Recurse -Force

    $totalSizeMB = [math]::Round((Get-Item $finalZipFile).Length / 1MB, 2)
    Write-Log "Gói sao lưu hoàn tất: $finalZipFile ($totalSizeMB MB)" -Level "SUCCESS"

    # 5. Xoay vòng bản sao lưu cục bộ (Chỉ giữ lại $KeepLocalCount bản mới nhất)
    Write-Log "Kiểm tra và dọn dẹp các bản sao lưu cũ (giữ lại $KeepLocalCount bản)..."
    $oldBackups = Get-ChildItem -Path $BackupDir -Filter "qlmt_backup_*.zip" | Sort-Object CreationTime -Descending | Select-Object -Skip $KeepLocalCount
    foreach ($old in $oldBackups) {
        Remove-Item -Path $old.FullName -Force
        Write-Log "Đã xóa bản sao lưu cũ: $($old.Name)" -Level "WARN"
    }

    # 6. Đồng bộ đám mây qua rclone crypt (Nếu được cấu hình)
    if (-not [string]::IsNullOrWhiteSpace($RcloneRemote)) {
        Write-Log "Đang tải bản backup mã hóa lên đám mây [$RcloneRemote]..."
        if (Get-Command rclone -ErrorAction SilentlyContinue) {
            rclone copy $finalZipFile $RcloneRemote --progress
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Đã đồng bộ thành công lên đám mây." -Level "SUCCESS"
            } else {
                Write-Log "Đồng bộ rclone gặp lỗi (Exit code: $LASTEXITCODE)." -Level "WARN"
            }
        } else {
            Write-Log "Không tìm thấy công cụ rclone trên hệ thống. Bỏ qua bước đẩy lên cloud." -Level "WARN"
        }
    }

    Write-Log "=== Quy trình sao lưu hoàn thành an toàn ===" -Level "SUCCESS"
    exit 0
}
catch {
    Write-Log "LỖI TRONG QUÁ TRÌNH SAO LƯU: $($_.Exception.Message)" -Level "ERROR"
    exit 1
}
