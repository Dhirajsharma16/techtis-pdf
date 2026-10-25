@echo off
title TECHTIS Serverless PDF Platform (techtis.in)
echo Starting TECHTIS Local Server on http://localhost:8080 ...

where node >nul 2>nul
if %errorlevel% equ 0 (
    node "%~dp0server.js"
) else (
    powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
)
pause
