import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string(),
  DB_PASSWORD: z.string().optional().default(""),
  DB_NAME: z.string().default("babymetal_foxbot"),
  JWT_SECRET: z.string().min(24, "JWT_SECRET debe tener al menos 24 caracteres"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY es requerida"),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  MAX_CONTEXT_MESSAGES: z.coerce.number().default(40),
  SUMMARY_CHAR_LIMIT: z.coerce.number().default(18000)
});

export const env = schema.parse(process.env);
