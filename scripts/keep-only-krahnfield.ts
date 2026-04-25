/**
 * Script: deja Kran(h)field como única cancha "disponible".
 * Marca el resto como `disponible: false` para limpiar la vista pública
 * de cara a la presentación de tesis. No borra nada — solo oculta.
 *
 * Uso:
 *   bun run scripts/keep-only-krahnfield.ts
 *   bun run scripts/keep-only-krahnfield.ts --restore   # revierte (todas disponibles)
 */
import mongoose from "mongoose";
import "dotenv/config";
import Cancha from "../src/models/Cancha";

const MONGODB_URI = process.env.MONGODB_URI;
const KEEP_PATTERN = /kra[hn]field/i; // matches "Kranhfield", "Krahnfield", etc.

async function main() {
  if (!MONGODB_URI) {
    console.error("❌ Falta MONGODB_URI en el entorno.");
    process.exit(1);
  }

  const restore = process.argv.includes("--restore");

  await mongoose.connect(MONGODB_URI);
  console.log("✅ Conectado a MongoDB");

  if (restore) {
    const r = await Cancha.updateMany({}, { $set: { disponible: true } });
    console.log(`♻️  Restauradas ${r.modifiedCount} canchas a disponibles`);
    await mongoose.disconnect();
    return;
  }

  const todas = await Cancha.find({}).select("_id nombre disponible").lean();
  if (todas.length === 0) {
    console.log("ℹ️ No hay canchas en la base.");
    await mongoose.disconnect();
    return;
  }

  const aMantener = todas.filter((c) => KEEP_PATTERN.test(c.nombre || ""));
  const aOcultar = todas.filter((c) => !KEEP_PATTERN.test(c.nombre || ""));

  console.log(`📋 Total canchas: ${todas.length}`);
  console.log(`✅ A mantener (${aMantener.length}):`);
  aMantener.forEach((c) => console.log(`   - ${c.nombre}`));
  console.log(`🙈 A ocultar (${aOcultar.length}):`);
  aOcultar.forEach((c) => console.log(`   - ${c.nombre}`));

  if (aMantener.length === 0) {
    console.warn("⚠️ No se encontró ninguna cancha que coincida con el patrón.");
    await mongoose.disconnect();
    return;
  }

  await Cancha.updateMany(
    { _id: { $in: aMantener.map((c) => c._id) } },
    { $set: { disponible: true } }
  );
  await Cancha.updateMany(
    { _id: { $in: aOcultar.map((c) => c._id) } },
    { $set: { disponible: false } }
  );

  console.log("✨ Listo. Solo Kran(h)field queda visible en /canchas.");
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error("❌ Error:", e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
