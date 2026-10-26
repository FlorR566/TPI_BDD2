// Conexión al cluster de MongoDB Atlas (driver nativo).
require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Falta MONGODB_URI. Copiá .env.example a .env y completalo.");
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

async function getDb() {
  await client.connect();
  return client.db(process.env.DB_NAME || "tienda_comida");
}

async function cerrar() {
  await client.close();
}

module.exports = { getDb, cerrar };
