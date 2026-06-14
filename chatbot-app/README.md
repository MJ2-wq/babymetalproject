# BABYMETAL Fox Bot

Aplicacion full-stack con frontend React, backend Node.js/Express, MySQL, autenticacion JWT, panel de administracion e integracion segura con la API de OpenAI.

## Estructura

```txt
chatbot-app/
  client/   # React + Vite
  server/   # Express + MySQL + OpenAI
```

## Requisitos

- Node.js 20 o superior.
- MySQL 8 o superior.
- Una API key de OpenAI.

## Instalacion

1. Entra a la carpeta:

```bash
cd D:\babymetalproject2\chatbot-app
```

2. Instala dependencias:

```bash
npm install
```

3. Crea la base de datos:

```bash
mysql -u root -p < server/sql/schema.sql
```

4. Copia variables de entorno:

```bash
copy server\.env.example server\.env
copy client\.env.example client\.env
```

5. Edita `server\.env`:

```env
OPENAI_API_KEY=tu_api_key
JWT_SECRET=un_secreto_largo_y_privado
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=babymetal_foxbot
```

6. Crea el primer admin registrando un usuario normal y luego ejecuta en MySQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'tu_correo@example.com';
```

7. Ejecuta en desarrollo:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:4000`

## Despliegue

### VPS

1. Instala Node.js, MySQL y Nginx.
2. Ejecuta `npm install`.
3. Ejecuta `npm run build`.
4. Sirve `client/dist` con Nginx.
5. Ejecuta `server` con PM2:

```bash
pm2 start server/src/index.js --name babymetal-foxbot
```

### Vercel

Recomendado desplegar `client` en Vercel y `server` en VPS/Render/Railway/Fly.io, porque MySQL y Express persistente encajan mejor fuera de funciones serverless. Configura `VITE_API_URL` en Vercel apuntando al backend.

## Seguridad

- La clave de OpenAI vive solo en `server/.env`.
- JWT firmado con `JWT_SECRET`.
- Passwords hasheados con bcrypt.
- Helmet, CORS y rate-limit activos.
- MySQL usa consultas preparadas.
- El frontend nunca recibe `OPENAI_API_KEY`.

## Contexto largo

El backend carga el resumen de conversacion y los ultimos mensajes. Cuando el historial crece demasiado, crea un resumen con OpenAI y lo guarda en MySQL para mantener contexto sin enviar toda la conversacion completa.
