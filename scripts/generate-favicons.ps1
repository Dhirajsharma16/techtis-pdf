Add-Type -AssemblyName System.Drawing

$rootDir = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $rootDir "favicon.png"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source file favicon.png not found at $sourcePath"
    exit 1
}

Write-Output "[Favicon Gen] Reading source image from $sourcePath..."
$srcBmp = [System.Drawing.Bitmap]::FromFile($sourcePath)

# 1. Detect tight bounding box of non-transparent pixels
$minX = $srcBmp.Width; $maxX = 0; $minY = $srcBmp.Height; $maxY = 0;
for ($y = 0; $y -lt $srcBmp.Height; $y++) {
    for ($x = 0; $x -lt $srcBmp.Width; $x++) {
        $c = $srcBmp.GetPixel($x, $y)
        if ($c.A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$cropW = $maxX - $minX + 1
$cropH = $maxY - $minY + 1
Write-Output "[Favicon Gen] Detected logo content box: ${cropW}x${cropH} at (${minX}, ${minY})"

# 2. Extract tight cropped logo
$croppedBmp = New-Object System.Drawing.Bitmap $cropW, $cropH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$cg = [System.Drawing.Graphics]::FromImage($croppedBmp)
$cg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$cg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$cg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$srcRect = New-Object System.Drawing.Rectangle $minX, $minY, $cropW, $cropH
$destRect = New-Object System.Drawing.Rectangle 0, 0, $cropW, $cropH
$cg.DrawImage($srcBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$cg.Dispose()
$srcBmp.Dispose()

# Helper function to generate centered square bitmap
function Create-SquareIcon([int]$size, [bool]$solidWhiteBg = $false) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    if ($solidWhiteBg) {
        $g.Clear([System.Drawing.Color]::White)
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Fit width to 90% of canvas, calculate proportional height
    $targetW = [math]::Round($size * 0.90)
    $targetH = [math]::Round($targetW * $cropH / $cropW)
    
    # If height exceeds 90% of canvas, scale by height instead
    if ($targetH -gt [math]::Round($size * 0.90)) {
        $targetH = [math]::Round($size * 0.90)
        $targetW = [math]::Round($targetH * $cropW / $cropH)
    }

    $posX = [math]::Round(($size - $targetW) / 2)
    $posY = [math]::Round(($size - $targetH) / 2)

    $destR = New-Object System.Drawing.Rectangle $posX, $posY, $targetW, $targetH
    $srcR = New-Object System.Drawing.Rectangle 0, 0, $cropW, $cropH
    $g.DrawImage($croppedBmp, $destR, $srcR, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    return $bmp
}

# 3. Generate PNG sizes
$sizes = @(512, 192, 96, 48, 32, 16)
$pngBitmaps = @{}

foreach ($sz in $sizes) {
    $bmp = Create-SquareIcon -size $sz -solidWhiteBg $false
    $pngBitmaps[$sz] = $bmp
    $outPath = Join-Path $rootDir "favicon-${sz}x${sz}.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Output "[Favicon Gen] Created $outPath ($($sz)x$($sz))"
}

# 4. Overwrite root favicon.png with high-res 512x512 square icon
$pngBitmaps[512].Save((Join-Path $rootDir "favicon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$pngBitmaps[512].Save((Join-Path $rootDir "assets/images/logo-icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "[Favicon Gen] Updated root favicon.png and assets/images/logo-icon.png to 512x512 square master"

# 5. Generate apple-touch-icon.png (180x180, solid white background for iOS Safari)
$appleBmp = Create-SquareIcon -size 180 -solidWhiteBg $true
$applePath = Join-Path $rootDir "apple-touch-icon.png"
$appleBmp.Save($applePath, [System.Drawing.Imaging.ImageFormat]::Png)
$appleBmp.Dispose()
Write-Output "[Favicon Gen] Created apple-touch-icon.png (180x180 solid white)"

# 6. Generate multi-resolution favicon.ico (16, 32, 48)
$icoSizes = @(48, 32, 16)
$pngBytesList = @()

foreach ($sz in $icoSizes) {
    $bmp = $pngBitmaps[$sz]
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytesList += ,$ms.ToArray()
    $ms.Dispose()
}

$msIco = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter $msIco

$bw.Write([uint16]0) # Reserved
$bw.Write([uint16]1) # Type: ICO
$bw.Write([uint16]$icoSizes.Count) # Count

$offset = 6 + ($icoSizes.Count * 16)

for ($i = 0; $i -lt $icoSizes.Count; $i++) {
    $sz = $icoSizes[$i]
    $data = $pngBytesList[$i]
    $bw.Write([byte]($sz % 256))
    $bw.Write([byte]($sz % 256))
    $bw.Write([byte]0)
    $bw.Write([byte]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]32)
    $bw.Write([uint32]$data.Length)
    $bw.Write([uint32]$offset)
    $offset += $data.Length
}

for ($i = 0; $i -lt $icoSizes.Count; $i++) {
    $bw.Write($pngBytesList[$i])
}

$icoBytes = $msIco.ToArray()
$bw.Dispose()
$msIco.Dispose()

$icoPath = Join-Path $rootDir "favicon.ico"
[System.IO.File]::WriteAllBytes($icoPath, $icoBytes)
Write-Output "[Favicon Gen] Created multi-res favicon.ico at $icoPath ($($icoBytes.Length) bytes)"

# Dispose all bitmaps
foreach ($sz in $sizes) {
    $pngBitmaps[$sz].Dispose()
}
$croppedBmp.Dispose()

Write-Output "[Favicon Gen] All icons generated successfully!"
