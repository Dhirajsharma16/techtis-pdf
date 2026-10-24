@echo off
title TECHTIS Serverless PDF Platform (techtis.in)
echo Starting TECHTIS Local Static Server...
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
