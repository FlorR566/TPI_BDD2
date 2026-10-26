# TPI NoSQL - Tienda de comida (MongoDB Atlas + Node.js)

Trabajo Práctico Integrador: modelado NoSQL, persistencia en la nube con **MongoDB Atlas**, aplicación backend con operaciones **CRUD** y script de **backup** con `mongodump`.

### Integrantes

| Apellido y nombre      | Comisión   |
| ---------------------- | ---------- |
| LARA A. ALDANA         | [comision] |
| MIGLIORANZA MANUEL A.  | [comision] |
| RODRIGUEZ FLORENCIA M. | 8          |

**Materia:** Bases de Datos II  
**Tutor:** Florencia Camila Gubiotti  
**Año:** 2026

### Requisitos

- Node.js 18+
- MongoDB Database Tools (`mongodump`): https://www.mongodb.com/try/download/database-tools
- Cluster M0 en MongoDB Atlas con usuario de base de datos e IP habilitada (Network Access)

### Puesta en marcha

```bash
npm install
cp .env.example .env      # completar MONGODB_URI con tu connection string
npm run setup             # crea colecciones con validación e índices
npm run demo              # ejecuta CREATE / READ / UPDATE / DELETE (baja lógica)
```

### Backup

```bash
chmod +x backup.sh && ./backup.sh     # Linux / Mac
.\backup.ps1                          # Windows PowerShell
```

Genera `resguardos_tpi/AAAA-MM-DD/tienda_comida/*.bson` y `*.metadata.json`.

Programación diaria (Linux, 03:00 hs):

```
0 3 * * * cd /ruta/al/proyecto && ./backup.sh >> resguardos_tpi/backup.log 2>&1
```

### Restauración

```bash
mongorestore --uri="$MONGODB_URI" --drop resguardos_tpi/AAAA-MM-DD
```

### Estructura

```
tpi_tienda_comida/
├── esquemas/
│   ├── categorias.json      # Ejemplo de documentos de categorías
│   ├── pedidos.json         # Ejemplo de documentos de pedidos
│   ├── productos.json       # Ejemplo de documentos de productos
│   └── usuarios.json        # Ejemplo de documentos de usuarios
├── src/
│   ├── crud.js              # Operaciones de consulta y manipulación
│   ├── db.js                # Conexión a la base de datos
│   ├── demo.js              # Script de demostración
│   └── setup.js             # Configuración de colecciones e índices
├── .env.example             # Plantilla de variables de entorno (sin datos sensibles)
├── .gitignore
├── backup.ps1               # Script de respaldo para Windows (PowerShell)
├── backup.sh                # Script de respaldo para Linux/macOS (Bash)
├── package-lock.json
├── package.json
└── README.md
```
