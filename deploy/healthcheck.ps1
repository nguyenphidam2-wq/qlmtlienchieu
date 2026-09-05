<#
.SYNOPSIS
    Script kiểm tra sức khỏe hệ thống (Healthcheck) cho QLMT Docker.
.DESCRIPTION
    Kiểm tra trạng thái các container Docker và phản hồi HTTP của cổng web.
    Dùng trong quá trình triển khai tự động (deploy) và giám sát định kỳ (Task Scheduler).
#>

[CmdletBinding()]
param (
    [string]$Url = "http://localhost:3000/login",
    [int]$MaxRetries = 10,
    [int]$RetryIntervalSec = 3
)

$ErrorActionPreference = "Continue"

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

Write-Log "Bắt đầu kiểm tra trạng thái sức khỏe hệ thống QLMT..."

# 1. Kiểm tra trạng thái Docker Containers
$requiredContainers = @("qlmt-mongo", "qlmt-web")
$containersHealthy = $true

foreach ($c in $requiredContainers) {
    $status = docker inspect --format="{{.State.Status}}" $c 2>$null
    if ($status -eq "running") {
        Write-Log "Container [$c]: Đang chạy (running)" -Level "SUCCESS"
    } else {
        Write-Log "Container [$c]: Không hoạt động (Trạng thái: $status)" -Level "ERROR"
        $containersHealthy = $false
    }
}

if (-not $containersHealthy) {
    Write-Log "Cảnh báo: Có container cốt lõi chưa hoạt động!" -Level "ERROR"
    exit 1
}

# 2. Kiểm tra phản hồi HTTP từ Web Server
Write-Log "Kiểm tra phản hồi Web endpoint: $Url (Tối đa $MaxRetries lần thử)..."
$httpSuccess = $false

for ($i = 1; $i -le $MaxRetries; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10 -Method Get
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
            Write-Log "Lần $i: Phản hồi HTTP $($response.StatusCode) OK từ $Url" -Level "SUCCESS"
            $httpSuccess = $true
            break
        } else {
            Write-Log "Lần $i: HTTP mã trạng thái $($response.StatusCode). Đang thử lại sau ${RetryIntervalSec}s..." -Level "WARN"
        }
    } catch {
        Write-Log "Lần $i: Chưa nhận được phản hồi ($($_.Exception.Message)). Đang thử lại sau ${RetryIntervalSec}s..." -Level "WARN"
    }
    Start-Sleep -Seconds $RetryIntervalSec
}

if ($httpSuccess) {
    Write-Log "=== Hệ thống QLMT hoạt động bình thường, sẵn sàng phục vụ ===" -Level "SUCCESS"
    exit 0
} else {
    Write-Log "=== KIỂM TRA THẤT BẠI: Web server không phản hồi trong thời gian quy định ===" -Level "ERROR"
    exit 1
}
