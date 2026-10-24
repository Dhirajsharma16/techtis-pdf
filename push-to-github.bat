@echo off
title Push TECHTIS to GitHub (Dhirajsharma16)
echo Starting GitHub Push Helper...
powershell -ExecutionPolicy Bypass -File "%~dp0push-to-github.ps1"
pause
