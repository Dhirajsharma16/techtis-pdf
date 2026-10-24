# Automated GitHub Push Script for TECHTIS (techtis.in)
param(
    [string]$RepoName = "techtis-pdf",
    [string]$GitHubUser = "Dhirajsharma16"
)

$ErrorActionPreference = "Continue"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " TECHTIS -> GitHub Deployment Helper ($GitHubUser)" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Ensure git is available
$minGit = "C:\Users\PEL\AppData\Local\Programs\MinGit\cmd"
if (Test-Path "$minGit\git.exe") {
    $env:Path = "$minGit;" + $env:Path
}

Set-Location -Path $PSScriptRoot

# 1. Initialize git if needed
if (-not (Test-Path ".git")) {
    Write-Host "[1/4] Initializing Git repository on 'main' branch..." -ForegroundColor Green
    git init -b main
} else {
    Write-Host "[1/4] Git repository already initialized." -ForegroundColor Green
    git branch -M main
}

# 2. Stage all files
Write-Host "[2/4] Staging files..." -ForegroundColor Green
git add .

# 3. Commit
Write-Host "[3/4] Committing code..." -ForegroundColor Green
git commit -m "Initial commit: TECHTIS Serverless $0-Cost PDF Platform (techtis.in)"

# 4. Set Remote
$remoteUrl = "https://github.com/$GitHubUser/$RepoName.git"
Write-Host "[4/4] Setting remote URL to: $remoteUrl" -ForegroundColor Green
git remote remove origin 2>$null
git remote add origin $remoteUrl

Write-Host "`nReady to push!" -ForegroundColor Yellow
Write-Host "Make sure you created the empty repository on GitHub first:" -ForegroundColor Cyan
Write-Host "  👉 https://github.com/new (Repository name: $RepoName)" -ForegroundColor White
Write-Host "`nPushing to GitHub..." -ForegroundColor Green
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCCESS! Your project is now on GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/$GitHubUser/$RepoName" -ForegroundColor Cyan
} else {
    Write-Host "`nIf Git asked for credentials, generate a GitHub Personal Access Token at:" -ForegroundColor Yellow
    Write-Host "  https://github.com/settings/tokens (classic token with 'repo' scope)" -ForegroundColor White
    Write-Host "Use your GitHub username and the token as your password." -ForegroundColor Yellow
}
