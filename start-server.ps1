Write-Host "正在啟動 Concept Crafter 伺服器..."

# 嘗試不同的連接埠
$ports = @(3000, 8080, 5500, 8000)
$port = 0
$http = $null

foreach ($p in $ports) {
    try {
        $url = "http://127.0.0.1:$p/"
        $tempHttp = [System.Net.HttpListener]::new()
        $tempHttp.Prefixes.Add($url)
        $tempHttp.Start()
        
        $http = $tempHttp
        $port = $p
        break
    } catch {
        Write-Warning "無法綁定連接埠 $p : $($_.Exception.Message)"
        if ($tempHttp) { $tempHttp.Close() }
    }
}

if (-not $http) {
    Write-Error "無法啟動伺服器，所有嘗試的連接埠都失敗。"
    Write-Host "請按 Enter 鍵退出..."
    Read-Host
    exit 1
}

try {
    Write-Host "伺服器已成功啟動！"
    Write-Host "網址: http://127.0.0.1:$port/ConceptCrafter.html"
    Write-Host "按 Ctrl+C 停止伺服器"

    # 自動開啟瀏覽器
    Start-Process "http://127.0.0.1:$port/ConceptCrafter.html"

    while ($http.IsListening) {
        $context = $http.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.Url.LocalPath
        if ($path -eq '/') { $path = '/ConceptCrafter.html' }
        
        # 移除開頭的斜線並解碼 URL
        $relativePath = [System.Web.HttpUtility]::UrlDecode($path.TrimStart('/'))
        $filePath = Join-Path $PWD $relativePath
        
        if (Test-Path $filePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            
            # 設定 MIME 類型
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            switch ($ext) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".js"   { $response.ContentType = "application/javascript" }
                ".css"  { $response.ContentType = "text/css" }
                ".json" { $response.ContentType = "application/json" }
                ".svg"  { $response.ContentType = "image/svg+xml" }
            }
            
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
            $response.StatusCode = 200
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
} catch {
    Write-Error "伺服器執行期間發生錯誤: $($_.Exception.Message)"
} finally {
    if ($http -and $http.IsListening) {
        $http.Stop()
    }
    Write-Host "伺服器已停止。"
    Write-Host "請按 Enter 鍵退出..."
    Read-Host
}
