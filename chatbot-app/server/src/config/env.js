import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const schema = z.object({
 const schema = z.object({
  DB_USER: z.string(),
  JWT_SECRET: z.string().min(24, "JWT_SECRET debe tener al menos 24 caracteres"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY es requerida"),
  // Agregamos el puerto para que Zod lo reconozca
  PORT: z.coerce.number().default(4000), 
});

export const env = schema.parse(process.env);