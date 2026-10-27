#!/usr/bin/env bash
# ============================================================
#  Respaldo fisico de MongoDB Atlas con mongodump (Linux / macOS)
#  Uso:  ./backup.sh
#  Crea:  resguardos_tpi/AAAA-MM-DD/<base>/...   (rutas relativas)
# ============================================================
set -euo pipefail

# 1) Rutas relativas: trabajar siempre desde la carpeta de este script
cd "$(dirname "$0")"

# 2) Configuracion: variable de entorno o archivo .env (se lee sin "source",
#    porque la URI de Atlas contiene '&' y la shell la cortaria)
if [ -z "${MONGODB_URI:-}" ] && [ -f .env ]; then
  MONGODB_URI="$(grep -E '^MONGODB_URI=' .env | head -n1 | cut -d= -f2- | tr -d '\r"')"
fi
if [ -z "${DB_NAME:-}" ] && [ -f .env ]; then
  DB_NAME="$(grep -E '^DB_NAME=' .env | head -n1 | cut -d= -f2- | tr -d '\r"')"
fi
: "${MONGODB_URI:?Falta MONGODB_URI (definila en .env o como variable de entorno)}"
DB_NAME="${DB_NAME:-tienda_comida}"

command -v mongodump >/dev/null 2>&1 || { echo "ERROR: mongodump no esta instalado (MongoDB Database Tools)"; exit 1; }

# 3) Carpeta resguardos_tpi / fecha actual (la fecha la calcula el propio script)
DESTINO="resguardos_tpi/$(date +%Y-%m-%d)"
mkdir -p "$DESTINO"

# 4) mongodump: se conecta remotamente a Atlas y descarga la base en esa carpeta
echo "Respaldando '$DB_NAME' en $DESTINO/ ..."
mongodump --uri="$MONGODB_URI" --db="$DB_NAME" --out="$DESTINO"

# 5) Verificacion
echo
echo "Backup finalizado OK. Contenido de $DESTINO:"
find "$DESTINO" -type f -exec ls -lh {} +
du -sh "$DESTINO"
