# KICH BAN CAP NHAT CODE THU CONG TU GITHUB CHO BAN PORTABLE
$RepoOwner = "nguyenphidam2-wq"
$RepoName = "qlmtlienchieu"
$Branch = "release-build"
# Doc Token tu file an nam tren Server PC (De tranh lo Token len Github)
$TokenFile = "C:\New folder\github_token.txt"
$GitHubToken = ""
if (Test-Path $TokenFile) {
    $GitHubToken = (Get-Content $TokenFile | Out-String).Trim()
}

$DownloadUrl = "https://raw.githubusercontent.com/$RepoOwner/$RepoName/$Branch/update.zip"
$Headers = @{}
if ($GitHubToken -ne "") {
    $Headers["Authorization"] = "token $GitHubToken"
}

$AppDir = "app"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   HE THONG CAP NHAT CODE TU GITHUB (THU CONG)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "[1/4] Dang tai ban cap nhat (update.zip) tu GitHub..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $DownloadUrl -OutFile "update.zip" -Headers $Headers -ErrorAction Stop

    Write-Host "[2/4] Tam dung Web Server hien tai..." -ForegroundColor Yellow
    taskkill /F /FI "WINDOWTITLE eq QLMT Web Server*" /T > $null 2>&1
    Start-Sleep -Seconds 2

    Write-Host "[3/4] Dang giai nen va ghi de code moi..." -ForegroundColor Yellow
    Expand-Archive -Path "update.zip" -DestinationPath $AppDir -Force

    Write-Host "[4/4] Khoi dong lai Web Server..." -ForegroundColor Yellow
    Start-Process "CHAY_HE_THONG_PORTABLE.bat"

    Write-Host ""
    Write-Host "DA CAP NHAT THANH CONG! He thong dang duoc khoi dong lai." -ForegroundColor Green
    Remove-Item "update.zip" -Force
} catch {
    Write-Host ""
    Write-Host "LOI: Khong the tai ban cap nhat. $_" -ForegroundColor Red
    Write-Host "Vui long kiem tra lai ket noi mang hoac cho Github build xong." -ForegroundColor Red
}

Write-Host ""
Write-Host "Nhan phim bat ky de thoat..." -ForegroundColor Gray
[System.Console]::ReadKey() | Out-Null
