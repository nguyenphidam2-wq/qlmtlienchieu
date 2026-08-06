# KỊCH BẢN TỰ ĐỘNG CẬP NHẬT CODE TỪ GITHUB CHO BẢN PORTABLE
# Chạy ngầm trên máy Server, tự động tải code mới mỗi khi bạn Push lên Github.

$RepoOwner = "nguyenphidam2-wq"
$RepoName = "qlmtlienchieu"
$Branch = "release-build"

# Doc Token tu file an nam tren Server PC (De tranh lo Token len Github)
$TokenFile = "C:\New folder\github_token.txt"
$GitHubToken = ""
if (Test-Path $TokenFile) {
    $GitHubToken = (Get-Content $TokenFile | Out-String).Trim()
}

$ApiUrl = "https://api.github.com/repos/$RepoOwner/$RepoName/commits/$Branch"
$DownloadUrl = "https://raw.githubusercontent.com/$RepoOwner/$RepoName/$Branch/update.zip"
$Headers = @{}
if ($GitHubToken -ne "") {
    $Headers["Authorization"] = "token $GitHubToken"
}

$CurrentCommitFile = "last_commit.txt"
$AppDir = "app"

Write-Host "===================================================" -ForegroundColor Green
Write-Host " HỆ THỐNG AUTO UPDATER 24/7 ĐANG CHẠY NGẦM" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host "Đừng tắt cửa sổ này. Nó sẽ tự động kiểm tra code mới mỗi 5 phút."

while ($true) {
    try {
        # 1. Kiểm tra mã Commit mới nhất trên GitHub
        $response = Invoke-RestMethod -Uri $ApiUrl -Headers $Headers -ErrorAction Stop
        $LatestCommit = $response.sha

        $CurrentCommit = ""
        if (Test-Path $CurrentCommitFile) {
            $CurrentCommit = Get-Content $CurrentCommitFile
        }

        # 2. Nếu có Code mới -> Tiến hành tải về và cập nhật
        if ($LatestCommit -ne $CurrentCommit) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Phát hiện phiên bản mới! Đang tiến hành cập nhật..." -ForegroundColor Yellow

            # Tải file update.zip
            Write-Host " -> Đang tải update.zip từ GitHub..."
            Invoke-WebRequest -Uri $DownloadUrl -OutFile "update.zip" -Headers $Headers -ErrorAction Stop

            # Tắt Web Server đang chạy
            Write-Host " -> Tạm dừng Web Server..."
            taskkill /F /FI "WINDOWTITLE eq QLMT Web Server*" /T > $null 2>&1
            Start-Sleep -Seconds 2

            # Giải nén đè lên thư mục app
            Write-Host " -> Đang bung code mới vào hệ thống..."
            Expand-Archive -Path "update.zip" -DestinationPath $AppDir -Force

            # Khởi động lại Web Server
            Write-Host " -> Khởi động lại Web Server..."
            Start-Process "CHAY_HE_THONG_PORTABLE.bat"

            # Lưu lại mã commit để lần sau không tải trùng
            Set-Content -Path $CurrentCommitFile -Value $LatestCommit

            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] CẬP NHẬT THÀNH CÔNG VÀ ĐÃ CHẠY LẠI WEB!" -ForegroundColor Green
            
            Remove-Item "update.zip" -Force
        } else {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Chưa có bản cập nhật mới. Ngủ 5 phút..." -ForegroundColor DarkGray
        }
    } catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Lỗi khi kiểm tra Github: $_" -ForegroundColor Red
    }

    Start-Sleep -Seconds 300
}
