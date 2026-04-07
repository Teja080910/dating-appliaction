$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$workspace = Split-Path -Parent $PSScriptRoot
$resRoot = Join-Path $workspace 'android\app\src\main\res'

$sizes = @{
  'mipmap-mdpi' = 48
  'mipmap-hdpi' = 72
  'mipmap-xhdpi' = 96
  'mipmap-xxhdpi' = 144
  'mipmap-xxxhdpi' = 192
}

function New-GradientBrush {
  param(
    [System.Drawing.RectangleF]$Rect,
    [string]$StartHex,
    [string]$MidHex,
    [string]$EndHex
  )

  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $Rect,
    [System.Drawing.ColorTranslator]::FromHtml($StartHex),
    [System.Drawing.ColorTranslator]::FromHtml($EndHex),
    45
  )

  $blend = New-Object System.Drawing.Drawing2D.ColorBlend
  $blend.Colors = @(
    [System.Drawing.ColorTranslator]::FromHtml($StartHex),
    [System.Drawing.ColorTranslator]::FromHtml($MidHex),
    [System.Drawing.ColorTranslator]::FromHtml($EndHex)
  )
  $blend.Positions = @(0.0, 0.48, 1.0)
  $brush.InterpolationColors = $blend
  return $brush
}

function New-BrandBitmap {
  param(
    [int]$CanvasSize = 1024,
    [bool]$Round = $false
  )

  $bitmap = New-Object System.Drawing.Bitmap $CanvasSize, $CanvasSize
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $fullRect = New-Object System.Drawing.RectangleF 0, 0, $CanvasSize, $CanvasSize
  $haloRect = New-Object System.Drawing.RectangleF ($CanvasSize * 0.08), ($CanvasSize * 0.08), ($CanvasSize * 0.84), ($CanvasSize * 0.84)
  $badgeRect = New-Object System.Drawing.RectangleF ($CanvasSize * 0.14), ($CanvasSize * 0.14), ($CanvasSize * 0.72), ($CanvasSize * 0.72)
  $innerRect = New-Object System.Drawing.RectangleF ($CanvasSize * 0.19), ($CanvasSize * 0.19), ($CanvasSize * 0.62), ($CanvasSize * 0.62)
  $rimRect = New-Object System.Drawing.RectangleF ($CanvasSize * 0.275), ($CanvasSize * 0.275), ($CanvasSize * 0.45), ($CanvasSize * 0.45)
  $coreRect = New-Object System.Drawing.RectangleF ($CanvasSize * 0.35), ($CanvasSize * 0.35), ($CanvasSize * 0.30), ($CanvasSize * 0.30)

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  if ($Round) {
    $path.AddEllipse($fullRect)
    $graphics.SetClip($path)
  }

  $haloBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(60, 255, 111, 145))
  $graphics.FillEllipse($haloBrush, $haloRect)

  $badgeBrush = New-GradientBrush -Rect $badgeRect -StartHex '#FFD4B9' -MidHex '#FF6E8B' -EndHex '#78133B'
  $badgePath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $corner = $CanvasSize * 0.18
  $badgePath.AddArc($badgeRect.X, $badgeRect.Y, $corner, $corner, 180, 90)
  $badgePath.AddArc($badgeRect.Right - $corner, $badgeRect.Y, $corner, $corner, 270, 90)
  $badgePath.AddArc($badgeRect.Right - $corner, $badgeRect.Bottom - $corner, $corner, $corner, 0, 90)
  $badgePath.AddArc($badgeRect.X, $badgeRect.Bottom - $corner, $corner, $corner, 90, 90)
  $badgePath.CloseFigure()
  $graphics.FillPath($badgeBrush, $badgePath)

  $innerBrush = New-GradientBrush -Rect $innerRect -StartHex '#FFFFFF' -MidHex '#FBC2CF' -EndHex '#8D214B'
  $innerBrush.GammaCorrection = $true
  $innerPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $innerCorner = $CanvasSize * 0.15
  $innerPath.AddArc($innerRect.X, $innerRect.Y, $innerCorner, $innerCorner, 180, 90)
  $innerPath.AddArc($innerRect.Right - $innerCorner, $innerRect.Y, $innerCorner, $innerCorner, 270, 90)
  $innerPath.AddArc($innerRect.Right - $innerCorner, $innerRect.Bottom - $innerCorner, $innerCorner, $innerCorner, 0, 90)
  $innerPath.AddArc($innerRect.X, $innerRect.Bottom - $innerCorner, $innerCorner, $innerCorner, 90, 90)
  $innerPath.CloseFigure()
  $overlayBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(36, 255, 255, 255))
  $graphics.FillPath($overlayBrush, $innerPath)
  $graphics.DrawPath((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(64, 255, 255, 255), ($CanvasSize * 0.01))), $innerPath)

  $rimBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(42, 106, 15, 49))
  $graphics.FillEllipse($rimBrush, $rimRect)
  $graphics.DrawEllipse((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(70, 255, 255, 255), ($CanvasSize * 0.01))), $rimRect)

  $coreBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(35, 255, 255, 255))
  $graphics.FillEllipse($coreBrush, $coreRect)
  $graphics.DrawEllipse((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(76, 255, 255, 255), ($CanvasSize * 0.008))), $coreRect)

  $font = New-Object System.Drawing.Font('Georgia', ($CanvasSize * 0.22), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $stringFormat = New-Object System.Drawing.StringFormat
  $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

  $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(65, 104, 12, 39))
  $textRectShadow = New-Object System.Drawing.RectangleF ($coreRect.X + ($CanvasSize * 0.008)), ($coreRect.Y + ($CanvasSize * 0.016)), $coreRect.Width, $coreRect.Height
  $graphics.DrawString('A', $font, $shadowBrush, $textRectShadow, $stringFormat)

  $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(245, 255, 255, 255))
  $graphics.DrawString('A', $font, $textBrush, $coreRect, $stringFormat)

  $barBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(215, 255, 255, 255))
  $barRect = New-Object System.Drawing.RectangleF ($CanvasSize * 0.418), ($CanvasSize * 0.60), ($CanvasSize * 0.165), ($CanvasSize * 0.018)
  $graphics.FillRectangle($barBrush, $barRect)

  $sparkBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#FFE0A4'))
  $graphics.FillEllipse($sparkBrush, ($CanvasSize * 0.67), ($CanvasSize * 0.24), ($CanvasSize * 0.1), ($CanvasSize * 0.1))
  $miniBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(176, 255, 255, 255))
  $graphics.FillEllipse($miniBrush, ($CanvasSize * 0.245), ($CanvasSize * 0.70), ($CanvasSize * 0.045), ($CanvasSize * 0.045))

  $graphics.Dispose()
  return $bitmap
}

function Save-ScaledIcon {
  param(
    [System.Drawing.Bitmap]$Source,
    [int]$Size,
    [string]$Path
  )

  $scaled = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($scaled)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.DrawImage($Source, 0, 0, $Size, $Size)
  $graphics.Dispose()
  $scaled.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $scaled.Dispose()
}

$squareSource = New-BrandBitmap -CanvasSize 1024 -Round:$false
$roundSource = New-BrandBitmap -CanvasSize 1024 -Round:$true

foreach ($entry in $sizes.GetEnumerator()) {
  $dir = Join-Path $resRoot $entry.Key
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir | Out-Null
  }

  Save-ScaledIcon -Source $squareSource -Size $entry.Value -Path (Join-Path $dir 'ic_launcher.png')
  Save-ScaledIcon -Source $roundSource -Size $entry.Value -Path (Join-Path $dir 'ic_launcher_round.png')
}

$squareSource.Dispose()
$roundSource.Dispose()

Write-Output 'Brand icon assets generated successfully.'
