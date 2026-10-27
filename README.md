# TPI NoSQL - Tienda de comida (MongoDB Atlas + Node.js)

## Requisitos

- Node.js 18+
- MongoDB Database Tools (`mongodump`): https://www.mongodb.com/try/download/database-tools
- Cluster M0 en MongoDB Atlas con usuario de base de datos e IP habilitada (Network Access)

## Puesta en marcha

```bash
npm install
cp .env.example .env      # completar MONGODB_URI con tu connection string
npm run setup             # crea colecciones con validación e índices
npm run demo              # ejecuta CREATE / READ / UPDATE / DELETE (baja lógica)
```

_Para un testeo más sencillo de la aplicación, se provee un archivo .env con un usuario temporal. El mismo **dejará de ser válido el martes 03 de noviembre**, momento posterior al cual deberá proveerse un MONGODB_URI propio para testear la aplicación._

## Backup

```bash
chmod +x backup.sh && ./backup.sh     # Linux / Mac
powershell -ExecutionPolicy Bypass -File .\backup.ps1   # Windows
```

Genera `resguardos_tpi/AAAA-MM-DD/tienda_comida/*.bson` y `*.metadata.json`.

Programación diaria (Linux, 03:00 hs):

```
0 3 * * * cd /ruta/al/proyecto && ./backup.sh >> resguardos_tpi/backup.log 2>&1
```

## Restauración

```bash
mongorestore --uri="$MONGODB_URI" --drop resguardos_tpi/AAAA-MM-DD
```

## Estructura

- `src/db.js` conexión · `src/crud.js` operaciones · `src/setup.js` colecciones/índices · `src/demo.js` demostración
- `esquemas/*.json` documentos de ejemplo de cada colección
- `backup.sh` / `backup.ps1` scripts de respaldo
