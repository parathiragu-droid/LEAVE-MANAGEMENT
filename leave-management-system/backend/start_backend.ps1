# Safe Backend Startup Script
# Environment variables must be set prior to running this script, or loaded from a secure vault.
# Do NOT hardcode credentials into this script.

if (-not $env:ADMIN1_EMAIL) {
    Write-Host "[WARN] ADMIN1_EMAIL environment variable is not set." -ForegroundColor Yellow
}
if (-not $env:ADMIN1_PASSWORD) {
    Write-Host "[WARN] ADMIN1_PASSWORD environment variable is not set." -ForegroundColor Yellow
}
if (-not $env:FRONTEND_URL) {
    $env:FRONTEND_URL = "http://localhost:5173"
}

Write-Host "Starting Spring Boot backend..." -ForegroundColor Cyan
& .\mvnw.cmd spring-boot:run
