# ============================================================
#  Respaldo fisico de MongoDB Atlas con mongodump (Windows / PowerShell)
#  Uso:  powershell -ExecutionPolicy Bypass -File .\backup.ps1
#  Crea:  resguardos_tpi\AAAA-MM-DD\<base>\...   (rutas relativas)
# ============================================================
$ErrorActionPreference = "Stop"

# 1) Rutas relativas: trabajar siempre desde la carpeta de este script
Set-Location $PSScriptRoot

# 2) Configuracion: variable de entorno o archivo .env
function Leer-Env($clave) {
  if (Test-Path ".env") {
    $l = Get-Content ".env" | Where-Object { $_ -match "^$clave=" } | Select-Object -First 1
    if ($l) { return ($l -replace "^$clave=", "").Trim().Trim('"') }
  }
  return $null
}
$uri = if ($env:MONGODB_URI) { $env:MONGODB_URI } else { Leer-Env "MONGODB_URI" }
$db  = if ($env:DB_NAME)     { $env:DB_NAME }     else { Leer-Env "DB_NAME" }
if (-not $uri) { throw "Falta MONGODB_URI (definila en .env o como variable de entorno)" }
if (-not $db)  { $db = "tienda_comida" }

if (-not (Get-Command mongodump -ErrorAction SilentlyContinue)) {
  throw "mongodump no esta instalado o no esta en el PATH (MongoDB Database Tools)"
}

# 3) Carpeta resguardos_tpi \ fecha actual (la fecha la calcula el propio script)
$destino = Join-Path "resguardos_tpi" (Get-Date -Format "yyyy-MM-dd")
New-Item -ItemType Directory -Force -Path $destino | Out-Null

# 4) mongodump: se conecta remotamente a Atlas y descarga la base en esa carpeta
Write-Host "Respaldando '$db' en $destino ..."
mongodump --uri="$uri" --db="$db" --out="$destino"
if ($LASTEXITCODE -ne 0) { throw "mongodump fallo (codigo $LASTEXITCODE)" }

# 5) Verificacion
Write-Host "`nBackup finalizado OK. Contenido de ${destino}:"
Get-ChildItem $destino -Recurse -File | Format-Table FullName, Length -AutoSize
