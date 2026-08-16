param(
  [Parameter(Mandatory=$true)][string]$PrinterName,
  [Parameter(Mandatory=$true)][string]$ImagePath,
  [int]$ContentWidthMm = 64
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$image = [System.Drawing.Image]::FromFile($ImagePath)
$document = New-Object System.Drawing.Printing.PrintDocument
$document.PrinterSettings.PrinterName = $PrinterName
if (-not $document.PrinterSettings.IsValid) { throw "Printer tidak ditemukan: $PrinterName" }

$document.PrintController = New-Object System.Drawing.Printing.StandardPrintController
$document.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0, 0, 0, 0)
$paperWidth = 315 # 80 mm dalam satuan 1/100 inch
$contentWidth = [Math]::Round($ContentWidthMm / 25.4 * 100)
$paperHeight = [Math]::Max(200, [Math]::Ceiling($image.Height * $contentWidth / $image.Width) + 16)
$document.DefaultPageSettings.PaperSize = New-Object System.Drawing.Printing.PaperSize('POS 80mm', $paperWidth, $paperHeight)
$document.DefaultPageSettings.Landscape = $false
$document.OriginAtMargins = $false

$handler = {
  param($sender, $eventArgs)
  $eventArgs.Graphics.PageUnit = [System.Drawing.GraphicsUnit]::Display
  $eventArgs.Graphics.Clear([System.Drawing.Color]::White)
  $eventArgs.Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $eventArgs.Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $eventArgs.Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
  $x = [Math]::Max(0, [Math]::Floor(($paperWidth - $contentWidth) / 2))
  $height = [Math]::Ceiling($image.Height * $contentWidth / $image.Width)
  $attributes = New-Object System.Drawing.Imaging.ImageAttributes
  $attributes.SetThreshold(0.58)
  $destination = New-Object System.Drawing.Rectangle($x, 0, $contentWidth, $height)
  $eventArgs.Graphics.DrawImage($image, $destination, 0, 0, $image.Width, $image.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
  $attributes.Dispose()
  $eventArgs.HasMorePages = $false
}

$document.add_PrintPage($handler)
try { $document.Print() }
finally {
  $document.remove_PrintPage($handler)
  $document.Dispose()
  $image.Dispose()
}
