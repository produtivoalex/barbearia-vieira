Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Alex\.gemini\antigravity-ide\brain\2d150e8d-ec6a-4101-bd77-a19b68ee7ce2\.user_uploaded\media_1788545010156.png"
$destPath = "assets\banner-na-regua.png"
$destCopy = "assets\banner-na-regua-1024x500.png"

$src = [System.Drawing.Image]::FromFile($srcPath)
$bmp = New-Object System.Drawing.Bitmap 1024, 500
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::FromArgb(14, 14, 14))

$y = [int]((500 - $src.Height) / 2)
$g.DrawImage($src, 0, $y, $src.Width, $src.Height)

$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save($destCopy, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$src.Dispose()

Write-Output "Banner 1024x500 gerado com sucesso!"
