// Operaciones CRUD con BAJA LÓGICA para todas las colecciones.
// Regla de oro: NUNCA se usa deleteOne/deleteMany. Se marca activo:false.
const { ObjectId } = require("mongodb");

const COLECCIONES = ["usuarios", "categorias", "productos", "pedidos"];

function validarColeccion(col) {
  if (!COLECCIONES.includes(col)) throw new Error(`Colección inválida: ${col}`);
}

function oid(id) {
  if (!ObjectId.isValid(id)) throw new Error(`ID inválido: ${id}`);
  return new ObjectId(id);
}

// ---------------------------------------------------------------- CREATE
async function crear(db, col, datos) {
  validarColeccion(col);
  const doc = { ...datos, activo: true, fecha_alta: new Date(), fecha_baja: null };
  const r = await db.collection(col).insertOne(doc);
  return { _id: r.insertedId, ...doc };
}

// CREATE de un pedido: arma el DETALLE embebido (snapshot de nombre y precio),
// calcula el total y descuenta stock.  items = [{ producto_id, cantidad }]
async function crearPedido(db, usuarioId, items, direccionEntrega) {
  const usuario = await db.collection("usuarios").findOne({ _id: oid(usuarioId), activo: true });
  if (!usuario) throw new Error("Usuario inexistente o dado de baja");
  if (!items || items.length === 0) throw new Error("El pedido necesita al menos un producto");

  const detalle = [];
  const descontados = [];
  try {
    for (const it of items) {
      const p = await db.collection("productos").findOne({ _id: oid(it.producto_id), activo: true });
      if (!p) throw new Error(`Producto no disponible: ${it.producto_id}`);
      // Descuento atómico solo si hay stock suficiente
      const r = await db.collection("productos").updateOne(
        { _id: p._id, activo: true, stock: { $gte: it.cantidad } },
        { $inc: { stock: -it.cantidad } });
      if (r.modifiedCount === 0) throw new Error(`Stock insuficiente de "${p.nombre}"`);
      descontados.push(it);
      detalle.push({
        producto_id: p._id,
        nombre: p.nombre,                 // snapshot: el historial no cambia si el producto cambia
        precio_unitario: p.precio,
        cantidad: it.cantidad,
        subtotal: p.precio * it.cantidad,
      });
    }
  } catch (e) {
    for (const it of descontados) {      // compensación simple si algo falló
      await db.collection("productos").updateOne({ _id: oid(it.producto_id) }, { $inc: { stock: it.cantidad } });
    }
    throw e;
  }

  return crear(db, "pedidos", {
    usuario_id: usuario._id,
    fecha_pedido: new Date(),
    estado: "pendiente",
    direccion_entrega: direccionEntrega || usuario.direccion || null,
    detalle,
    total: detalle.reduce((acc, d) => acc + d.subtotal, 0),
  });
}

// ------------------------------------------------------------------ READ
// Siempre filtra activo:true => los dados de baja NO se listan.
async function listar(db, col, filtro = {}) {
  validarColeccion(col);
  return db.collection(col).find({ ...filtro, activo: true }).toArray();
}

async function obtenerPorId(db, col, id) {
  validarColeccion(col);
  return db.collection(col).findOne({ _id: oid(id), activo: true });
}

// Productos con el nombre de su categoría (LINKING resuelto con $lookup)
async function listarProductosConCategoria(db) {
  return db.collection("productos").aggregate([
    { $match: { activo: true } },
    { $lookup: { from: "categorias", localField: "categoria_id", foreignField: "_id", as: "categoria" } },
    { $unwind: "$categoria" },
    { $project: { _id: 1, nombre: 1, precio: 1, stock: 1, categoria: "$categoria.nombre" } },
    { $sort: { nombre: 1 } },
  ]).toArray();
}

// Pedidos con datos del usuario; el detalle ya viene embebido
async function listarPedidosConUsuario(db) {
  return db.collection("pedidos").aggregate([
    { $match: { activo: true } },
    { $lookup: { from: "usuarios", localField: "usuario_id", foreignField: "_id", as: "usuario" } },
    { $unwind: "$usuario" },
    { $project: {
        _id: 1, fecha_pedido: 1, estado: 1, total: 1, detalle: 1,
        usuario: { $concat: ["$usuario.nombre", " ", "$usuario.apellido"] },
        cantidad_items: { $size: "$detalle" },
    } },
    { $sort: { fecha_pedido: -1 } },
  ]).toArray();
}

// ---------------------------------------------------------------- UPDATE
// Solo actualiza los campos indicados y solo sobre documentos activos.
async function actualizar(db, col, id, campos) {
  validarColeccion(col);
  const datos = { ...campos };
  ["_id", "activo", "fecha_alta", "fecha_baja"].forEach((k) => delete datos[k]);
  const r = await db.collection(col).updateOne(
    { _id: oid(id), activo: true },
    { $set: { ...datos, fecha_modificacion: new Date() } });
  return { encontrados: r.matchedCount, modificados: r.modifiedCount };
}

// ---------------------------------------------- DELETE (BAJA LÓGICA)
async function bajaLogica(db, col, id) {
  validarColeccion(col);
  const _id = oid(id);
  const baja = { $set: { activo: false, fecha_baja: new Date() } };
  const r = await db.collection(col).updateOne({ _id, activo: true }, baja);

  // Cascada (también lógica). Los pedidos ya entregados se conservan como historial.
  if (r.modifiedCount === 1) {
    if (col === "categorias") {
      await db.collection("productos").updateMany({ categoria_id: _id, activo: true }, baja);
    }
    if (col === "usuarios") {
      await db.collection("pedidos").updateMany(
        { usuario_id: _id, activo: true, estado: { $in: ["pendiente", "preparando"] } }, baja);
    }
  }
  return { encontrados: r.matchedCount, dadosDeBaja: r.modifiedCount };
}

// Extra: reactivar un documento dado de baja.
async function reactivar(db, col, id) {
  validarColeccion(col);
  const r = await db.collection(col).updateOne(
    { _id: oid(id), activo: false }, { $set: { activo: true, fecha_baja: null } });
  return { reactivados: r.modifiedCount };
}

module.exports = {
  crear, crearPedido, listar, obtenerPorId,
  listarProductosConCategoria, listarPedidosConUsuario,
  actualizar, bajaLogica, reactivar,
};
