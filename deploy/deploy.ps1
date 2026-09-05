<#
.SYNOPSIS
    Script tự động hóa quy trình cập nhật và triển khai hệ thống QLMT qua Docker.
.DESCRIPTION
    1. Kiểm tra môi trường và file .env.production.
    2. Tự động sao lưu database & uploads trước khi nâng cấp.
    3. Cập nhật mã nguồn mới nhất từ Git.
    4. Xây dựng và khởi chạy container Docker Compose.
    5. Kiểm tra sức khỏe (Healthcheck) và tự động rollback nếu thất bại.
#>

[CmdletBinding()]
param (
    [string]$Branch = "release-build",
    [string]$EnvFile = ".env.production",
    [switch]$SkipBackup = $false,
    [switch]$AutoRollback = $true
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

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

try {
    Write-Log "=== BẮT ĐẦU QUY TRÌNH TRIỂN KHAI / NÂNG CẤP HỆ THỐNG QLMT ==="

    # 1. Kiểm tra file cấu hình .env.production
    $envPath = Join-Path $projectRoot $EnvFile
    if (-not (Test-Path $envPath)) {
        throw "Không tìm thấy file cấu hình môi trường: $EnvFile. Hãy tạo file từ .env.production.example trước khi triển khai."
    }
    Write-Log "Đã xác nhận file cấu hình môi trường: $EnvFile" -Level "SUCCESS"

    # 2. Lưu lại Commit Hash hiện tại để phục vụ rollback nếu cần
    $currentCommit = git rev-parse HEAD 2>$null
    Write-Log "Commit hash hiện tại: $currentCommit"

    # 3. Thực hiện sao lưu trước khi cập nhật
    if (-not $SkipBackup) {
        Write-Log "Thực hiện sao lưu an toàn trước khi cập nhật mã nguồn..."
        $backupScript = Join-Path $PSScriptRoot "backup.ps1"
        if (Test-Path $backupScript) {
            & powershell -ExecutionPolicy Bypass -File $backupScript
            if ($LASTEXITCODE -ne 0) {
                throw "Quá trình sao lưu trước nâng cấp thất bại. Đã hủy tiến trình deploy để bảo vệ dữ liệu."
            }
        }
    } else {
        Write-Log "Cảnh báo: Bỏ qua bước sao lưu theo tham số -SkipBackup." -Level "WARN"
    }

    # 4. Kéo mã nguồn mới nhất từ Git
    Write-Log "Đang đồng bộ mã nguồn từ nhánh [$Branch]..."
    git fetch origin $Branch
    git checkout $Branch
    git pull --ff-only origin $Branch
    if ($LASTEXITCODE -ne 0) {
        throw "Đồng bộ git thất bại. Vui lòng kiểm tra xung đột hoặc kết nối mạng."
    }
    $newCommit = git rev-parse HEAD
    Write-Log "Đã cập nhật đến commit mới: $newCommit" -Level "SUCCESS"

    # 5. Xây dựng lại và khởi chạy Docker Compose
    Write-Log "Đang xây dựng image và tái khởi động container Docker Compose..."
    docker compose --env-file $EnvFile up -d --build --remove-orphans
    if ($LASTEXITCODE -ne 0) {
        throw "Lệnh docker compose up -d --build thất bại."
    }

    # 6. Kiểm tra sức khỏe hệ thống (Health Check)
    Write-Log "Đang thực hiện kiểm tra sức khỏe hệ thống..."
    $healthCheckScript = Join-Path $PSScriptRoot "healthcheck.ps1"
    & powershell -ExecutionPolicy Bypass -File $healthCheckScript
    $healthStatus = $LASTEXITCODE

    if ($healthStatus -ne 0) {
        Write-Log "CẢNH BÁO: Kiểm tra sức khỏe thất bại sau khi triển khai!" -Level "ERROR"

        if ($AutoRollback -and (-not [string]::IsNullOrWhiteSpace($currentCommit)) -and ($currentCommit -ne $newCommit)) {
            Write-Log "Kích hoạt tự động Rollback về commit trước đó: $currentCommit ..." -Level "WARN"
            git checkout $currentCommit
            docker compose --env-file $EnvFile up -d --build --remove-orphans
            Write-Log "Đã khôi phục về phiên bản trước. Vui lòng kiểm tra log lỗi của bản mới." -Level "WARN"
        } else {
            Write-Log "Bạn có thể tự khôi phục thủ công bằng lệnh:" -Level "WARN"
            Write-Log "  git checkout $currentCommit" -Level "WARN"
            Write-Log "  docker compose --env-file $EnvFile up -d --build" -Level "WARN"
        }
        exit 1
    }

    # 7. Dọn dẹp images không sử dụng
    Write-Log "Dọn dẹp image tạm (dangling images)..."
    docker image prune -f | Out-Null

    Write-Log "=== TRIỂN KHAI THÀNH CÔNG HỆ THỐNG QLMT ===" -Level "SUCCESS"
    exit 0
}
catch {
    Write-Log "LỖI TRIỂN KHAI: $($_.Exception.Message)" -Level "ERROR"
    exit 1
}
