# Respaldo físico de la base en MongoDB Atlas usando mongodump (Windows / PowerShell).
# Uso:  .\backup.ps1      (requiere MONGODB_URI en .env o en el entorno)
$ErrorActionPreference = "Stop"

# Ubicarse en la carpeta del script => rutas relativas al proyecto
Set-Location $PSScriptRoot

# Cargar variables desde .env si existe
if (Test-Path ".env") {
  Get-Content ".env" | Where-Object { $_ -match "^\s*[^#].*=" } | ForEach-Object {
    $k, $v = $_ -split "=", 2
    [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim(), "Process")
  }
}
if (-not $env:MONGODB_URI) { throw "Falta MONGODB_URI (definila en .env)" }
$db = if ($env:DB_NAME) { $env:DB_NAME } else { "tienda_comida" }

$fecha   = Get-Date -Format "yyyy-MM-dd"
$destino = Join-Path "resguardos_tpi" $fecha
New-Item -ItemType Directory -Force -Path $destino | Out-Null

Write-Host "Iniciando backup de '$db' en $destino"
mongodump --uri="$env:MONGODB_URI" --db="$db" --out="$destino"
if ($LASTEXITCODE -ne 0) { throw "mongodump falló (código $LASTEXITCODE)" }
Write-Host "Backup finalizado OK"
