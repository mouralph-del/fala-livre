# Resize only the approved icon; preserve its proportions and original file.
Add-Type -AssemblyName System.Drawing
$repoRoot = Split-Path $PSScriptRoot -Parent
$outputPath = Join-Path $repoRoot 'public/pwa'
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
$source = [System.Drawing.Image]::FromFile((Join-Path $repoRoot 'src/assets/illustrations/fala-livre-icon.png'))
try {
  foreach ($variant in @(@('icon-192.png',192,1.0), @('icon-512.png',512,1.0), @('icon-maskable-512.png',512,0.68), @('apple-touch-icon.png',180,1.0))) {
    $size = [int]$variant[1]
    $bitmap = New-Object System.Drawing.Bitmap($size,$size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.Clear([System.Drawing.Color]::White)
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $scale = [double]$variant[2] * $size / [Math]::Max($source.Width,$source.Height)
      $width = [int]($source.Width * $scale)
      $height = [int]($source.Height * $scale)
      $graphics.DrawImage($source,[int](($size-$width)/2),[int](($size-$height)/2),$width,$height)
      $bitmap.Save((Join-Path $outputPath $variant[0]),[System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $graphics.Dispose(); $bitmap.Dispose() }
  }
} finally { $source.Dispose() }
