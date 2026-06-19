import mysql from "mysql2/promise";
import { env } from "./env.js";

let pool = null;
let useMemory = false;

// In-memory fallback when MySQL is not available
const memStore = {
  users: [],
  conversations: [],
  messages: [],
  nextId: 1,
};

try {
  pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    namedPlaceholders: true,
    connectTimeout: 3000,
  });
  // Test connection
  const conn = await pool.getConnection();
  conn.release();
  console.log("✓ MySQL conectado");
} catch (err) {
  console.warn("⚠ MySQL no disponible, usando almacenamiento en memoria:", err.message);
  useMemory = true;
}

// Simulated query executor for in-memory mode
function memQuery(sql, params = {}) {
  const lower = sql.trim().toLowerCase();

  // INSERT
  if (lower.startsWith("insert into users")) {
    const exists = memStore.users.find((u) => u.email === params.email);
    if (exists) {
      const err = new Error("Duplicate entry");
      err.code = "ER_DUP_ENTRY";
      throw err;
    }
    const id = memStore.nextId++;
    const user = { id, name: params.name, email: params.email, password_hash: params.passwordHash, role: "user", created_at: new Date().toISOString() };
    memStore.users.push(user);
    return { insertId: id };
  }

  // SELECT user by email
  if (lower.includes("from users where email")) {
    return memStore.users.filter((u) => u.email === params.email);
  }

  // SELECT user by id
  if (lower.includes("from users where id")) {
    return memStore.users.filter((u) => u.id === params.id);
  }

  // SELECT all users
  if (lower.includes("select") && lower.includes("from users") && !lower.includes("where")) {
    return memStore.users.map(({ password_hash, ...u }) => u);
  }

  // INSERT conversation
  if (lower.startsWith("insert into conversations")) {
    const id = memStore.nextId++;
    const conv = { id, user_id: params.userId, title: params.title || "Chat", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    memStore.conversations.push(conv);
    return { insertId: id };
  }

  // SELECT conversations
  if (lower.includes("from conversations where user_id")) {
    return memStore.conversations.filter((c) => c.user_id === params.userId).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  // SELECT conversation by id
  if (lower.includes("from conversations where id") && lower.includes("and user_id")) {
    return memStore.conversations.filter((c) => c.id == params.id && c.user_id == params.userId);
  }

  // UPDATE conversation
  if (lower.startsWith("update conversations")) {
    const conv = memStore.conversations.find((c) => c.id == params.id);
    if (conv) { conv.title = params.title || conv.title; conv.updated_at = new Date().toISOString(); }
    return [];
  }

  // INSERT message
  if (lower.startsWith("insert into messages")) {
    const id = memStore.nextId++;
    const msg = { id, conversation_id: params.conversationId, role: params.role, content: params.content, created_at: new Date().toISOString() };
    memStore.messages.push(msg);
    return { insertId: id };
  }

  // SELECT messages
  if (lower.includes("from messages where conversation_id")) {
    return memStore.messages.filter((m) => m.conversation_id == params.conversationId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  // COUNT queries for admin
  if (lower.includes("count(*)")) {
    if (lower.includes("from users")) return [{ count: memStore.users.length }];
    if (lower.includes("from conversations")) return [{ count: memStore.conversations.length }];
    if (lower.includes("from messages")) return [{ count: memStore.messages.length }];
  }

  return [];
}

export async function query(sql, params = {}) {
  if (useMemory) return memQuery(sql, params);
  const [rows] = await pool.execute(sql, params);
  return rows;
}
