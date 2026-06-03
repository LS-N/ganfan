# Supabase keepalive — queries nutrition_items to prevent free-tier auto-pause
$url = "https://dhvqlojvnnuuaxqmhbbs.supabase.co/rest/v1/nutrition_items?limit=1&select=id"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRodnFsb2p2bm51dWF4cW1oYmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MzAyNjUsImV4cCI6MjA5NDMwNjI2NX0.BRzG9jD9gjQ5Yu7BCuNsPgEOUxHhceXL_qOHBIDesgI"

$headers = @{
    "apikey"        = $anonKey
    "Authorization" = "Bearer $anonKey"
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$logFile = Join-Path $PSScriptRoot "keepalive.log"

try {
    $response = Invoke-WebRequest -Uri $url -Headers $headers -Method GET -UseBasicParsing -TimeoutSec 30
    $msg = "[$timestamp] OK (HTTP $($response.StatusCode))"
    Write-Output $msg
    Add-Content -Path $logFile -Value $msg
} catch {
    $msg = "[$timestamp] FAILED — $($_.Exception.Message)"
    Write-Output $msg
    Add-Content -Path $logFile -Value $msg
    exit 1
}
