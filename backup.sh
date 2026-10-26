#!/usr/bin/env bash
# Respaldo físico de la base en MongoDB Atlas usando mongodump.
# Uso:  ./backup.sh        (requiere MONGODB_URI en .env o en el entorno)
set -euo pipefail

# Ubicarse en la carpeta del script => todas las rutas son relativas al proyecto
cd "$(dirname "$0")"

# Cargar variables desde .env si existe
if [ -f .env ]; then
  set -a; . ./.env; set +a
fi
: "${MONGODB_URI:?Falta MONGODB_URI (definila en .env)}"
DB_NAME="${DB_NAME:-tienda_comida}"

FECHA="$(date +%Y-%m-%d)"
DESTINO="resguardos_tpi/${FECHA}"

mkdir -p "${DESTINO}"
echo "[$(date '+%F %T')] Iniciando backup de '${DB_NAME}' en ${DESTINO}/"

mongodump --uri="${MONGODB_URI}" --db="${DB_NAME}" --out="${DESTINO}"

echo "[$(date '+%F %T')] Backup finalizado OK:"
ls -lh "${DESTINO}/${DB_NAME}"
