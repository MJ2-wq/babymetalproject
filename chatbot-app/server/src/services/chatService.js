import { env } from "../config/env.js";
import { query } from "../config/db.js";

let openai = null;
try {
  const mod = await import("../config/openai.js");
  openai = mod.openai;
} catch {
  // OpenAI not configured
}

const SYSTEM_PROMPT = `
Eres FOX BOT, un asistente de una comunidad fan no oficial de BABYMETAL.
Responde en español, con tono amable, energia metalera y precision.
Puedes hablar de musica, miembros, giras, historia, juegos fan y uso de la web.
No afirmes ser representante oficial de BABYMETAL.
Si no sabes una fecha oficial, dilo y sugiere verificar fuentes oficiales.
`;

// Fallback responses when OpenAI is not available
const FALLBACK_RESPONSES = {
  default: "¡Hola! Soy FOX BOT 🦊 Aún no tengo conexión con OpenAI para responder con inteligencia artificial. Mientras tanto, pregunta por giras, canciones, historia o integrantes de BABYMETAL y haré lo mejor que pueda.",
  giras: "BABYMETAL ha tenido varias giras mundiales importantes:\n\n• 2013-2014: Babymetal World Tour\n• 2015: Babymetal Dark Night Circus\n• 2016: The Red Tour\n• 2017: Babymetal Awakens / The Five Fox Festival\n• 2018: The Five Fox Festival / Metal Galaxy\n• 2019-2020: Metal Galaxy World Tour\n• 2023-2024: The Other One Tour\n• 2025-2026: The Other One World Tour 2026 🦊",
  quienes: "BABYMETAL es un grupo japonés de kawaii metal formado en 2010:\n\n🦊 SU-METAL (Suzuka Nakamoto) - Vocalista\n⭐ MOAMETAL (Moa Kikuchi) - Dance/Vocal\n🌸 MOMOMETAL (Momoko Okazaki) - Dance/Vocal\n\n¡Todas son increíbles! 🤘",
  canciones: "Algunas canciones icónicas de BABYMETAL:\n\n🔥 Gimme Chocolate!!\n⚡ Karate\n🦊 Megitsune\n🌙 Road of Resistance\n🎸 KARATE\n💎 The One\n🎶 Distortion\n🦢 Pa Pa Ya!!\n🔥 Monochrome",
  fox: "El Fox God (Kitsune-Sama) 🦊 es una figura mítica en el universo de BABYMETAL. Se dice que eligió a las chicas para ser las guerreras del metal. ¡Es el guía espiritual de la banda y de todos los fans!",
  historia: "BABYMETAL nació en 2010 como un proyecto dentro de Sakura Gakuin. Su debut oficial fue en 2011 con 'Doki Doki Morning'. Desde entonces han revolucionado el metal mundial mezclando kawaii con potencia musical. 🤘🦊"
};

function getFallbackResponse(content) {
  const lower = content.toLowerCase();
  if (lower.includes("gira") || lower.includes("tour") || lower.includes("concierto")) return FALLBACK_RESPONSES.giras;
  if (lower.includes("quien") || lower.includes("miembro") || lower.includes("integra")) return FALLBACK_RESPONSES.quienes;
  if (lower.includes("cancion") || lower.includes("song") || lower.includes("tema")) return FALLBACK_RESPONSES.canciones;
  if (lower.includes("fox") || lower.includes("dios") || lower.includes("kitsune")) return FALLBACK_RESPONSES.fox;
  if (lower.includes("historia") || lower.includes("origen") || lower.includes("cuando")) return FALLBACK_RESPONSES.historia;
  return FALLBACK_RESPONSES.default;
}

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

  let answer;

  if (!openai || !env.OPENAI_API_KEY) {
    // Fallback: respond without OpenAI
    answer = getFallbackResponse(content);
  } else {
    try {
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

      answer = response.output_text || "No pude generar una respuesta en este momento.";
    } catch (err) {
      console.error("OpenAI error:", err.message);
      answer = getFallbackResponse(content);
    }
  }

  await saveMessage(conversation.id, "assistant", answer);
  await query("UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = :id", { id: conversation.id });

  return {
    conversationId: conversation.id,
    message: answer
  };
}
