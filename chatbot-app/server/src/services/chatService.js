import { env } from "../config/env.js";
import { query } from "../config/db.js";
import { openai } from "../config/openai.js";

const SYSTEM_PROMPT = `
Eres FOX BOT, un asistente de una comunidad fan no oficial de BABYMETAL.
Responde en español, con tono amable, energia metalera y precision.
Puedes hablar de musica, miembros, giras, historia, juegos fan y uso de la web.
No afirmes ser representante oficial de BABYMETAL.
Si no sabes una fecha oficial, dilo y sugiere verificar fuentes oficiales.
`;

export async function getConversationForUser(conversationId, userId) {
  const rows = await query(
    "SELECT * FROM conversations WHERE id = :conversationId AND user_id = :userId LIMIT 1",
    { conversationId, userId }
  );
  return rows[0] || null;
}

export async function createConversation(userId, title = "Nueva conversacion") {
  const result = await query(
    "INSERT INTO conversations (user_id, title) VALUES (:userId, :title)",
    { userId, title }
  );
  return result.insertId;
}

export async function listConversations(userId) {
  return query(
    `SELECT id, title, created_at, updated_at
     FROM conversations
     WHERE user_id = :userId
     ORDER BY updated_at DESC`,
    { userId }
  );
}

export async function listMessages(conversationId) {
  return query(
    `SELECT id, role, content, created_at
     FROM messages
     WHERE conversation_id = :conversationId
     ORDER BY created_at ASC`,
    { conversationId }
  );
}

async function saveMessage(conversationId, role, content) {
  await query(
    "INSERT INTO messages (conversation_id, role, content) VALUES (:conversationId, :role, :content)",
    { conversationId, role, content }
  );
}

function estimateChars(messages) {
  return messages.reduce((sum, msg) => sum + msg.content.length, 0);
}

async function summarizeIfNeeded(conversation, allMessages) {
  if (estimateChars(allMessages) < env.SUMMARY_CHAR_LIMIT) return conversation.summary || "";

  const older = allMessages.slice(0, Math.max(0, allMessages.length - env.MAX_CONTEXT_MESSAGES));
  if (!older.length) return conversation.summary || "";

  const response = await openai.responses.create({
    model: env.OPENAI_MODEL,
    input: [
      {
        role: "system",
        content: "Resume esta conversacion para conservar contexto futuro. Mantén datos, gustos del usuario, decisiones y tareas pendientes."
      },
      {
        role: "user",
        content: older.map((m) => `${m.role}: ${m.content}`).join("\n")
      }
    ]
  });

  const summary = response.output_text || conversation.summary || "";
  await query("UPDATE conversations SET summary = :summary WHERE id = :id", {
    summary,
    id: conversation.id
  });
  return summary;
}

export async function sendChatMessage({ userId, conversationId, content }) {
  let conversation = conversationId ? await getConversationForUser(conversationId, userId) : null;

  if (!conversation) {
    const title = content.slice(0, 70) || "Nueva conversacion";
    conversationId = await createConversation(userId, title);
    conversation = await getConversationForUser(conversationId, userId);
  }

  await saveMessage(conversation.id, "user", content);
  const allMessages = await listMessages(conversation.id);
  const summary = await summarizeIfNeeded(conversation, allMessages);
  const recentMessages = allMessages.slice(-env.MAX_CONTEXT_MESSAGES);

  const input = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(summary ? [{ role: "system", content: `Resumen de contexto previo:\n${summary}` }] : []),
    ...recentMessages.map((message) => ({ role: message.role, content: message.content }))
  ];

  const response = await openai.responses.create({
    model: env.OPENAI_MODEL,
    input
  });

  const answer = response.output_text || "No pude generar una respuesta en este momento.";
  await saveMessage(conversation.id, "assistant", answer);
  await query("UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = :id", { id: conversation.id });

  return {
    conversationId: conversation.id,
    message: answer
  };
}
