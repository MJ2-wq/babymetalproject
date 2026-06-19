import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Copy index.html from client to root to restore it in the correct place
const sourcePath = path.join(__dirname, "chatbot-app", "client", "index.html");
const destPath = path.join(__dirname, "index.html");

try {
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log("✓ Copiado index.html al directorio raíz.");
  } else {
    console.warn("⚠ No se encontró el archivo origen en chatbot-app/client/index.html");
  }
} catch (err) {
  console.error("Error copiando index.html:", err.message);
}

// 2. Start the local server
const PORT = 3000;
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  const decodedUrl = decodeURIComponent(req.url);
  let filePath = path.join(__dirname, decodedUrl === "/" ? "index.html" : decodedUrl);
  
  // Prevent directory traversal attacks
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>404 Archivo no encontrado</h1>", "utf-8");
      } else {
        res.writeHead(500);
        res.end(`Error del servidor: ${error.code}`);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🦊 FOX NET - Servidor local estático activo`);
  console.log(`👉 Abre tu navegador en: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
