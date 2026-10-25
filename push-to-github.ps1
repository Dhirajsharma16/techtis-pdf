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
$minGit = "$env:LOCALAPPDATA\Programs\MinGit\cmd"
if (Test-Path "$minGit\git.exe") {
    $env:Path = "$minGit;" + $env:Path
}

Set-Location -Path $PSScriptRoot

# 1. Initialize git if needed
if (-not (Test-Path ".git")) {
    Write-Host "[1/4] Initializing Git repository on 'main' branch..." -ForegroundColor Green
    git init -b main
} else {
    Write-Host "[1/4] Git repository initialized on branch main." -ForegroundColor Green
    git branch -M main
}

# 2. Stage all files
Write-Host "[2/4] Staging files..." -ForegroundColor Green
git add -A

# 3. Commit if any uncommitted changes remain
Write-Host "[3/4] Checking commit status..." -ForegroundColor Green
$uncommitted = git status --porcelain
if ($uncommitted) {
    git commit -m "feat: implement image tools suite, passport photo maker, private document OCR, compliance pages, and 40-tool SEO pipeline"
} else {
    Write-Host "All changes already committed." -ForegroundColor Green
}

# 4. Set Remote
$remoteUrl = "https://github.com/$GitHubUser/$RepoName.git"
Write-Host "[4/4] Remote URL: $remoteUrl" -ForegroundColor Green
git remote remove origin 2>$null
git remote add origin $remoteUrl

Write-Host "`nPushing latest code to GitHub..." -ForegroundColor Green
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCCESS! Your project is now on GitHub with dedicated SEO pages for all 40 tools!" -ForegroundColor Green
} else {
    Write-Warning "`nPush failed. Check your GitHub authentication or repository access permissions."
    Write-Host "If you see 'Permission denied to <user>', your Windows Git Credential Manager has cached a different GitHub account." -ForegroundColor Yellow
    Write-Host "To fix:" -ForegroundColor Yellow
    Write-Host "1. In GitHub repo settings (https://github.com/Dhirajsharma16/techtis-pdf/settings/access), add your active user as a collaborator with Write access." -ForegroundColor Cyan
    Write-Host "   OR" -ForegroundColor Cyan
    Write-Host "2. Run: git remote set-url origin https://<YOUR_GITHUB_TOKEN>@github.com/$GitHubUser/$RepoName.git" -ForegroundColor Cyan
}
