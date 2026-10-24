# Zero-Dependency Local Static HTTP Server for Windows
# Serves the TECHTIS platform at http://localhost:8080 with proper MIME types

param(
    [int]$Port = 8080
)

$rootDir = $PSScriptRoot
if (-not $rootDir -or -not (Test-Path "$rootDir\index.html")) {
    $rootDir = "C:\Users\PEL\.gemini\antigravity\scratch\zerocost-pdf-suite"
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    $Port = 8085
    $prefix = "http://localhost:$Port/"
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($prefix)
    $listener.Start()
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " TECHTIS - Serverless Zero-Cost PDF Platform (techtis.in)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Local server running at: $prefix" -ForegroundColor Yellow
Write-Host " Root Directory: $rootDir" -ForegroundColor Gray
Write-Host " Press Ctrl+C in this console to stop the server." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Green

# Launch default browser
Start-Process $prefix

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".mjs"  = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".pdf"  = "application/pdf"
    ".wasm" = "application/wasm"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Add CORS headers
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD")
        $response.Headers.Add("Access-Control-Allow-Headers", "*")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.OutputStream.Close()
            continue
        }

        $rawUrl = $request.Url.LocalPath
        if ($rawUrl -eq "/" -or $rawUrl -eq "") {
            $rawUrl = "/index.html"
        }

        $relativePath = $rawUrl.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
        $filePath = [System.IO.Path]::Combine($rootDir, $relativePath)

        if ([System.IO.File]::Exists($filePath)) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = $mimeTypes[$ext]
            if (-not $contentType) {
                $contentType = "application/octet-stream"
            }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.StatusCode = 200
            if ($request.HttpMethod -ne "HEAD") {
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rawUrl")
            $response.ContentLength64 = $msg.Length
            if ($request.HttpMethod -ne "HEAD") {
                $response.OutputStream.Write($msg, 0, $msg.Length)
            }
        }

        $response.OutputStream.Close()
    } catch {
        # Log and keep listening smoothly
        Write-Warning "Request handling notice: $_"
    }
}
