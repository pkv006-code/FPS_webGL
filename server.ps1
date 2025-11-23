# Мини HTTP-сервер на PowerShell
# Раздаёт файлы из папки, где лежит этот скрипт
# Дополнительно: /maps.json возвращает список папок в ./maps

$port = 8080
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Root: $root"

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "Server started on $prefix"
    Write-Host "Открой в браузере: http://localhost:$port/"
    Write-Host "Нажми Ctrl+C в этом окне, чтобы остановить."
}
catch {
    Write-Host "Не удалось запустить HttpListener на $prefix"
    Write-Host "Сообщение ошибки:"
    Write-Host $_.Exception.Message
    Read-Host "Нажми Enter, чтобы закрыть окно"
    exit
}

function Get-ContentType($path) {
    switch ([System.IO.Path]::GetExtension($path).ToLower()) {
        ".html" { "text/html; charset=utf-8" }
        ".htm"  { "text/html; charset=utf-8" }
        ".js"   { "application/javascript; charset=utf-8" }
        ".css"  { "text/css; charset=utf-8" }
        ".png"  { "image/png" }
        ".jpg"  { "image/jpeg" }
        ".jpeg" { "image/jpeg" }
        ".gif"  { "image/gif" }
        ".webp" { "image/webp" }
        ".ico"  { "image/x-icon" }
        ".json" { "application/json; charset=utf-8" }
        default { "application/octet-stream" }
    }
}

while ($true) {
    $context = $listener.GetContext()
    $request  = $context.Request
    $response = $context.Response

    $path = $request.Url.AbsolutePath.TrimStart("/")

    if ([string]::IsNullOrWhiteSpace($path)) {
        $path = "index.html"
    }

    if ($path -eq "maps.json") {
        try {
            $mapsDir = Join-Path $root "maps"
            $folders = Get-ChildItem $mapsDir -Directory | Select-Object -ExpandProperty Name
            $json = ConvertTo-Json $folders -Compress
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.StatusCode = 200
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch {
            $response.StatusCode = 500
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("Server error")
            $response.ContentType = "text/plain; charset=utf-8"
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        $response.OutputStream.Close()
        continue
    }

    $localPath = Join-Path $root $path

    if (Test-Path $localPath -PathType Leaf) {
        try {
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $response.StatusCode  = 200
            $response.ContentType = Get-ContentType $localPath
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch {
            $response.StatusCode = 500
        }
    } else {
        $response.StatusCode = 404
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.ContentType = "text/plain; charset=utf-8"
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    }

    $response.OutputStream.Close()
}
