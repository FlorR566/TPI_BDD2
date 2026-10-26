// Demostración del ciclo completo CRUD contra MongoDB Atlas.  npm run demo
const { getDb, cerrar } = require("./db");
const crud = require("./crud");

(async () => {
  const db = await getDb();
  console.log("Conectado a MongoDB Atlas, base:", db.databaseName, "\n");
  const s = Math.floor(Math.random() * 1e6).toString(); // evita choques con índices únicos al re-ejecutar

  // ---------------- CREATE
  console.log("=== CREATE ===");
  const cat = await crud.crear(db, "categorias", { nombre: "Pizzas " + s, descripcion: "Pizzas artesanales" });
  const p1 = await crud.crear(db, "productos", { nombre: "Pizza Muzzarella", precio: 8500, stock: 20, categoria_id: cat._id });
  const p2 = await crud.crear(db, "productos", { nombre: "Fugazzeta", precio: 9800, stock: 15, categoria_id: cat._id });
  const usuario = await crud.crear(db, "usuarios", {
    nombre: "Lucía", apellido: "Fernández", email: `lucia${s}@example.com`, telefono: "+54 11 5555-1234", rol: "cliente",
    direccion: { calle: "Av. Santa Fe 1234", localidad: "Pilar", provincia: "Buenos Aires" },
  });
  const pedido = await crud.crearPedido(db, usuario._id, [
    { producto_id: p1._id, cantidad: 2 },
    { producto_id: p2._id, cantidad: 1 },
  ]);
  console.log("Pedido creado:", pedido._id.toString(), "| total:", pedido.total, "\n");

  // ---------------- READ
  console.log("=== READ (solo activos, con $lookup) ===");
  console.table(await crud.listarProductosConCategoria(db));
  console.table((await crud.listarPedidosConUsuario(db)).map((x) => ({
    usuario: x.usuario, items: x.cantidad_items, total: x.total, estado: x.estado })));

  // ---------------- UPDATE
  console.log("=== UPDATE ===");
  console.log("Precio:", await crud.actualizar(db, "productos", p1._id, { precio: 9000 }));
  console.log("Estado:", await crud.actualizar(db, "pedidos", pedido._id, { estado: "preparando" }), "\n");

  // ---------------- DELETE (baja lógica)
  console.log("=== DELETE (baja lógica) ===");
  console.log(await crud.bajaLogica(db, "productos", p2._id));
  const activos = await crud.listar(db, "productos", { _id: p2._id });
  console.log("Producto en listado de activos:", activos.length, "(esperado: 0)");
  const fisico = await db.collection("productos").findOne({ _id: p2._id });
  console.log("Producto en la colección (físico):", { nombre: fisico.nombre, activo: fisico.activo, fecha_baja: fisico.fecha_baja });

  console.log(await crud.bajaLogica(db, "usuarios", usuario._id), "(sus pedidos pendientes también pasan a activo:false)");

  await cerrar();
})().catch(async (e) => { console.error("Error:", e.message); await cerrar(); process.exit(1); });
