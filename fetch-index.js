import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const destPath1 = path.join(__dirname, "index.html");
const destPath2 = path.join(__dirname, "chatbot-app", "client", "index.html");

console.log("Descargando index.html desde https://babymetalproject.vercel.app/ ...");

https.get("https://babymetalproject.vercel.app/", (res) => {
  if (res.statusCode !== 200) {
    console.error(`Error al descargar: Código de estado ${res.statusCode}`);
    process.exit(1);
  }

  // Read data into a buffer
  const chunks = [];
  res.on("data", (chunk) => chunks.push(chunk));
  res.on("end", () => {
    const buffer = Buffer.concat(chunks);

    // Save to root
    fs.writeFileSync(destPath1, buffer);
    console.log("✓ Guardado en: d:\\babymetalproject2\\index.html");

    // Save to chatbot-app/client
    try {
      fs.writeFileSync(destPath2, buffer);
      console.log("✓ Guardado en: d:\\babymetalproject2\\chatbot-app\\client\\index.html");
    } catch (err) {
      console.error("Error al guardar en el cliente:", err.message);
    }

    console.log("✓ Archivos recuperados exitosamente.");
  });
}).on("error", (err) => {
  console.error("Error de red:", err.message);
  process.exit(1);
});
