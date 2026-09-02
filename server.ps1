$ErrorActionPreference = "SilentlyContinue"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8765

$listener = New-Object System.Net.Sockets.TcpListener(
    [System.Net.IPAddress]::Loopback,
    $port
)

$listener.Start()

$url = "http://127.0.0.1:$port/"

Start-Sleep -Milliseconds 500
Start-Process $url

Write-Host ""
Write-Host "Prototype is running..."
Write-Host $url
Write-Host ""
Write-Host "Do not close this window while using the demo."
Write-Host ""

function Get-ContentType($path) {

    switch ([System.IO.Path]::GetExtension($path).ToLower()) {

        ".html" { return "text/html; charset=utf-8" }
        ".htm"  { return "text/html; charset=utf-8" }

        ".css"  { return "text/css; charset=utf-8" }

        ".js"   { return "application/javascript; charset=utf-8" }

        ".json" { return "application/json; charset=utf-8" }

        ".png"  { return "image/png" }
        ".jpg"  { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".gif"  { return "image/gif" }
        ".svg"  { return "image/svg+xml" }
        ".ico"  { return "image/x-icon" }

        ".woff"  { return "font/woff" }
        ".woff2" { return "font/woff2" }

        default { return "application/octet-stream" }

    }

}

while ($true) {

    $client = $listener.AcceptTcpClient()

    try {

        $stream = $client.GetStream()

        $reader = New-Object System.IO.StreamReader($stream)

        $requestLine = $reader.ReadLine()

        if (!$requestLine) {
            $client.Close()
            continue
        }

        while (($line = $reader.ReadLine()) -ne "") {
        }

        $parts = $requestLine.Split(" ")

        $requestPath = $parts[1]

        $requestPath = $requestPath.Split("?")[0]

        $requestPath = [System.Uri]::UnescapeDataString($requestPath)

        if ($requestPath -eq "/") {
            $requestPath = "/index.html"
        }

        $relativePath = $requestPath.TrimStart("/").Replace("/", "\")

        $filePath = Join-Path $root $relativePath

        if (Test-Path $filePath -PathType Leaf) {

            $bytes = [System.IO.File]::ReadAllBytes($filePath)

            $contentType = Get-ContentType $filePath

            $header = (
                "HTTP/1.1 200 OK`r`n" +
                "Content-Type: $contentType`r`n" +
                "Content-Length: $($bytes.Length)`r`n" +
                "Cache-Control: no-cache`r`n" +
                "Connection: close`r`n`r`n"
            )

            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)

            $stream.Write(
                $headerBytes,
                0,
                $headerBytes.Length
            )

            $stream.Write(
                $bytes,
                0,
                $bytes.Length
            )

        }
        else {

            $body = [System.Text.Encoding]::UTF8.GetBytes(
                "404 - File Not Found"
            )

            $header = (
                "HTTP/1.1 404 Not Found`r`n" +
                "Content-Type: text/plain; charset=utf-8`r`n" +
                "Content-Length: $($body.Length)`r`n" +
                "Connection: close`r`n`r`n"
            )

            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)

            $stream.Write(
                $headerBytes,
                0,
                $headerBytes.Length
            )

            $stream.Write(
                $body,
                0,
                $body.Length
            )

        }

        $stream.Flush()

    }
    finally {

        $client.Close()

    }

}