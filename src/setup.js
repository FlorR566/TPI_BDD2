// Crea las colecciones con validación $jsonSchema e índices. Ejecutar una vez: npm run setup
const { getDb, cerrar } = require("./db");

const base = {
  activo: { bsonType: "bool" },
  fecha_alta: { bsonType: "date" },
  fecha_baja: { bsonType: ["date", "null"] },
};

const validadores = {
  usuarios: {
    required: ["nombre", "apellido", "email", "activo"],
    properties: {
      nombre: { bsonType: "string" },
      apellido: { bsonType: "string" },
      email: { bsonType: "string" },
      telefono: { bsonType: "string" },
      direccion: { bsonType: "object" }, // embedding
      rol: { enum: ["cliente", "admin"] },
      ...base,
    },
  },
  categorias: {
    required: ["nombre", "activo"],
    properties: {
      nombre: { bsonType: "string" },
      descripcion: { bsonType: "string" },
      ...base,
    },
  },
  productos: {
    required: ["nombre", "precio", "stock", "categoria_id", "activo"],
    properties: {
      nombre: { bsonType: "string" },
      precio: { bsonType: ["double", "int", "long", "decimal"], minimum: 0 },
      stock: { bsonType: ["int", "long", "double"], minimum: 0 },
      categoria_id: { bsonType: "objectId" }, // linking
      ...base,
    },
  },
  pedidos: {
    required: [
      "usuario_id",
      "fecha_pedido",
      "estado",
      "detalle",
      "total",
      "activo",
    ],
    properties: {
      usuario_id: { bsonType: "objectId" }, // linking
      fecha_pedido: { bsonType: "date" },
      estado: { enum: ["pendiente", "preparando", "entregado", "cancelado"] },
      detalle: {
        // embedding (detalle del pedido)
        bsonType: "array",
        minItems: 1,
        items: {
          bsonType: "object",
          required: [
            "producto_id",
            "nombre",
            "precio_unitario",
            "cantidad",
            "subtotal",
          ],
          properties: {
            producto_id: { bsonType: "objectId" }, // linking al producto original
            nombre: { bsonType: "string" },
            precio_unitario: { bsonType: ["double", "int", "long", "decimal"] },
            cantidad: { bsonType: ["int", "long", "double"], minimum: 1 },
            subtotal: { bsonType: ["double", "int", "long", "decimal"] },
          },
        },
      },
      total: { bsonType: ["double", "int", "long", "decimal"] },
      ...base,
    },
  },
};

(async () => {
  const db = await getDb();
  const existentes = (await db.listCollections().toArray()).map((c) => c.name);

  for (const [nombre, schema] of Object.entries(validadores)) {
    if (!existentes.includes(nombre)) {
      await db.createCollection(nombre, {
        validator: { $jsonSchema: { bsonType: "object", ...schema } },
      });
      console.log(`Colección creada: ${nombre}`);
    } else {
      console.log(`Ya existía: ${nombre}`);
    }
  }

  // Índices únicos solo entre activos (permite re-alta tras una baja lógica)
  await db
    .collection("usuarios")
    .createIndex(
      { email: 1 },
      { unique: true, partialFilterExpression: { activo: true } },
    );
  await db
    .collection("categorias")
    .createIndex(
      { nombre: 1 },
      { unique: true, partialFilterExpression: { activo: true } },
    );
  await db.collection("productos").createIndex({ categoria_id: 1, activo: 1 });
  await db.collection("pedidos").createIndex({ usuario_id: 1, activo: 1 });
  await db.collection("pedidos").createIndex({ fecha_pedido: -1 });
  console.log("Índices creados. Setup OK.");
  await cerrar();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
