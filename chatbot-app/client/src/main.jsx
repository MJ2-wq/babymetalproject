import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { api, clearSession, getUser, setSession } from "./lib/api.js";
import VideoModal from "./components/VideoModal.jsx";
import Feed from "./components/Feed.jsx";
import "./styles.css";

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login"
        ? { email: form.email, password: form.password }
        : form;
      const data = await api(path, { method: "POST", body: JSON.stringify(payload) });
      setSession(data.token, data.user);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="bot-mark">FOX</div>
        <h1>{mode === "login" ? "Entrar a FOX BOT" : "Crear cuenta fan"}</h1>
        <p>Chatbot para fans de BABYMETAL con historial privado, contexto largo y modo oscuro.</p>
        <form onSubmit={submit}>
          {mode === "register" && (
            <input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          )}
          <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <div className="error">{error}</div>}
          <button className="primary" type="submit">{mode === "login" ? "Iniciar sesion" : "Registrarme"}</button>
        </form>
        <button className="link-btn" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Crear una cuenta nueva" : "Ya tengo cuenta"}
        </button>
      </section>
    </main>
  );
}

function AppMenu({ user, view, setView }) {
  const handle = useMemo(() => `@${user?.name?.toLowerCase().replace(/\s+/g, "_")}`, [user]);
  return (
    <nav className="side-menu">
      <div className="profile-card-mini" style={{ padding: "16px", borderBottom: "1px solid var(--line)", marginBottom: "12px", textAlign: "center" }}>
        <div className="profile-avatar-large" style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--red)", margin: "0 auto 10px", display: "grid", placeItems: "center", fontSize: "28px", color: "#fff", fontWeight: "bold" }}>
          {user?.name?.[0]?.toUpperCase() || "🦊"}
        </div>
        <h3 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 4px" }}>{user?.name}</h3>
        <span style={{ fontSize: "12px", color: "var(--muted)" }}>{handle}</span>
        <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--red)", fontWeight: "bold", background: "rgba(255, 0, 72, 0.1)", padding: "4px 8px", borderRadius: "20px", display: "inline-block" }}>
          🏆 Kitsune Fan
        </div>
      </div>
      <button className={`side-menu-item ${view === "feed" ? "active" : ""}`} onClick={() => setView("feed")}>
        <span className="icon">🏠</span> Inicio / Muro
      </button>
      <button className={`side-menu-item ${view === "chat" ? "active" : ""}`} onClick={() => setView("chat")}>
        <span className="icon">🤖</span> Fox Bot Chat
      </button>
      <button className="side-menu-item" onClick={() => window.open("https://babymetal.com", "_blank")}>
        <span className="icon">🦊</span> The One Community
      </button>
      <button className="side-menu-item" onClick={() => { clearSession(); window.location.reload(); }}>
        <span className="icon">🚪</span> Cerrar Sesión
      </button>
    </nav>
  );
}

function SocialFeed({ user, onOpenVideo }) {
  // Sample local stories
  const defaultStories = [
    { id: "su", name: "SU-METAL", avatar: "🦊", avatarColor: "var(--red)", text: "Tokio Dome fue increíble! 🤘🦊", time: "Hace 2h" },
    { id: "moa", name: "MOAMETAL", avatar: "🌸", avatarColor: "#ec4899", text: "La Metal Resistance nunca muere 💀", time: "Hace 4h" },
    { id: "momo", name: "MOMOMETAL", avatar: "⚡", avatarColor: "#9333ea", text: "Kawaii Metal forever! 🎀🤘", time: "Hace 6h" },
  ];

  return (
    <div className="social-feed-container">
      {/* Stories list */}
      <div className="stories-section" style={{ display: "flex", gap: "12px", marginBottom: "20px", overflowX: "auto", paddingBottom: "10px", borderBottom: "1px solid var(--line)" }}>
        {defaultStories.map((story) => (
          <div key={story.id} className="story-card" style={{ flexShrink: 0, width: "90px", textAlign: "center", cursor: "pointer" }}>
            <div className="story-ring" style={{ width: "56px", height: "56px", borderRadius: "50%", padding: "3px", background: "linear-gradient(135deg, var(--red), #ff6b6b)", margin: "0 auto 6px", display: "grid", placeItems: "center" }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#111", display: "grid", placeItems: "center", fontSize: "20px", border: "2px solid #000" }}>
                {story.avatar}
              </div>
            </div>
            <div style={{ fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{story.name}</div>
          </div>
        ))}
      </div>

      <Feed user={user} />
    </div>
  );
}

function RightWidgetArea({ onOpenVideo, messages, typing, bottomRef, input, setInput, sendMessage, user }) {
  return (
    <aside className="right-widgets" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Trending panel */}
      <div className="trending-box" style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "12px", padding: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px", fontFamily: "var(--font-heading)" }}>🔥 Tendencias</h3>
        {[
          { tag: "#BABYMETAL", cat: "Música · Tendencia" },
          { tag: "#MetalResistance", cat: "Metal · Tendencia" },
          { tag: "#FoxGod", cat: "Fox God · Tendencia" }
        ].map((item, idx) => (
          <div key={idx} style={{ padding: "8px 0", borderBottom: idx < 2 ? "1px solid var(--line)" : "none" }}>
            <div style={{ fontSize: "10px", color: "var(--muted)" }}>{item.cat}</div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--red)", cursor: "pointer" }}>{item.tag}</div>
          </div>
        ))}
      </div>

      {/* Mini Fox Bot widget */}
      <div className="foxbot-widget-card" style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", height: "360px" }}>
        <header className="chat-header" style={{ padding: "10px 12px", background: "var(--panel-2)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="fox-avatar" style={{ width: "30px", height: "30px", fontSize: "14px" }}>🦊</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: "13px", margin: 0 }}>Fox Bot</h4>
            <span style={{ fontSize: "10px", color: "var(--green)" }}>En línea</span>
          </div>
          <button onClick={onOpenVideo} style={{ fontSize: "12px", background: "var(--red)", color: "#fff", padding: "3px 8px", borderRadius: "12px", border: "none" }}>
            ▶ Video
          </button>
        </header>

        <div className="messages" style={{ flex: 1, padding: "12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          {!messages.length && (
            <div className="welcome" style={{ padding: "8px", fontSize: "12px" }}>
              <p>¡Hola! Pregúntame sobre giras, canciones, historia de BABYMETAL al instante.</p>
            </div>
          )}
          {messages.map((message) => (
            <article key={message.id} className={`message ${message.role}`} style={{ maxWidth: "90%", padding: "8px 10px", fontSize: "12px" }}>
              <div className="message-label" style={{ fontSize: "9px" }}>{message.role === "assistant" ? "🦊 FOX BOT" : "Tu"}</div>
              <p style={{ margin: 0 }}>{message.content}</p>
            </article>
          ))}
          {typing && <div className="typing" style={{ fontSize: "11px" }}>Escribiendo...</div>}
          <div ref={bottomRef} />
        </div>

        <form className="input-bar" style={{ padding: "8px", background: "var(--panel-2)" }} onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Preguntar a la IA..." style={{ padding: "8px 12px", fontSize: "12px" }} />
          <button type="submit" style={{ fontSize: "14px", width: "32px", height: "32px" }}>➤</button>
        </form>
      </div>
    </aside>
  );
}

function ChatPanel({ user }) {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [view, setView] = useState("feed"); // "feed" | "chat"

  async function loadConversations() {
    const data = await api("/api/chat/conversations");
    setConversations(data.conversations);
  }

  async function loadMessages(id) {
    setActiveId(id);
    const data = await api(`/api/chat/conversations/${id}/messages`);
    setMessages(data.messages);
  }

  useEffect(() => {
    loadConversations().catch(console.error);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || typing) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content, id: `tmp-${Date.now()}` }]);
    setTyping(true);
    try {
      const data = await api("/api/chat/messages", {
        method: "POST",
        body: JSON.stringify({ conversationId: activeId, content })
      });
      setActiveId(data.conversationId);
      await loadConversations();
      const loaded = await api(`/api/chat/conversations/${data.conversationId}/messages`);
      setMessages(loaded.messages);
    } finally {
      setTyping(false);
    }
  }

  return (
    <section className="app-layout-grid" style={{ display: "grid", gridTemplateColumns: "260px 1fr 300px", gap: "20px", maxWidth: "1280px", margin: "0 auto", padding: "20px" }}>
      {/* Columna Izquierda: Menú / Acciones */}
      <aside className="left-column">
        <AppMenu user={user} view={view} setView={setView} />
      </aside>

      {/* Columna Central: Contenido Principal */}
      <main className="main-content-column">
        {view === "feed" ? (
          <SocialFeed user={user} onOpenVideo={() => setVideoOpen(true)} />
        ) : (
          <div className="chat-card-full" style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", height: "600px" }}>
            <header className="chat-header" style={{ padding: "16px", background: "var(--panel-2)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="fox-avatar">🦊</div>
                <div>
                  <h1 style={{ fontSize: "16px", margin: 0 }}>FOX BOT (Asistente Completo)</h1>
                  <span style={{ fontSize: "11px", color: "var(--green)" }}>En línea</span>
                </div>
              </div>
              <button onClick={() => setVideoOpen(true)} style={{ background: "var(--red)", color: "#fff", padding: "6px 12px", border: "none", fontWeight: "bold" }}>
                ▶ Ver BABYMETAL
              </button>
            </header>
            <div className="quick-row" style={{ padding: "10px 16px", background: "var(--panel-2)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["todas las giras", "Quienes son?", "Canciones", "Conciertos", "Fox God", "Historia"].map((q) => (
                <button key={q} onClick={() => sendMessage(q)} style={{ fontSize: "11px", padding: "4px 8px" }}>{q}</button>
              ))}
            </div>
            <div className="messages" style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              {messages.map((message) => (
                <article key={message.id} className={`message ${message.role}`}>
                  <div className="message-label">{message.role === "assistant" ? "🦊 FOX BOT" : "Tu"}</div>
                  <p>{message.content}</p>
                </article>
              ))}
              {typing && <div className="typing">La IA está escribiendo...</div>}
              <div ref={bottomRef} />
            </div>
            <form className="input-bar" style={{ padding: "12px" }} onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu pregunta..." />
              <button type="submit">➤</button>
            </form>
          </div>
        )}
      </main>

      {/* Columna Derecha: Widgets de Interacción y Chatbox Rápido */}
      <RightWidgetArea
        onOpenVideo={() => setVideoOpen(true)}
        messages={messages}
        typing={typing}
        bottomRef={bottomRef}
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        user={user}
      />

      <VideoModal
        isOpen={videoOpen}
        videoUrl={videoUrl || "https://www.youtube.com/watch?v=Zv3LZ7kOHxM"}
        onClose={() => setVideoOpen(false)}
      />
    </section>
  );
}

function AdminPanel({ user }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (user.role !== "admin") return;
    api("/api/admin/stats").then(setStats).catch(console.error);
    api("/api/admin/users").then((data) => setUsers(data.users)).catch(console.error);
  }, [user.role]);

  if (user.role !== "admin") return null;

  return (
    <aside className="admin-panel" style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "12px", padding: "16px", maxWidth: "1280px", margin: "10px auto" }}>
      <h2 style={{ fontSize: "15px", marginBottom: "12px", fontFamily: "var(--font-heading)" }}>Admin Panel</h2>
      {stats && (
        <div className="admin-stats" style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          <span style={{ fontSize: "12px", background: "var(--panel-2)", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--line)" }}>{stats.users} usuarios</span>
          <span style={{ fontSize: "12px", background: "var(--panel-2)", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--line)" }}>{stats.conversations} chats</span>
          <span style={{ fontSize: "12px", background: "var(--panel-2)", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--line)" }}>{stats.messages} mensajes</span>
        </div>
      )}
      <div className="admin-users" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {users.map((item) => (
          <div key={item.id} style={{ fontSize: "11px", background: "var(--panel-2)", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--line)" }}>
            {item.name} <small style={{ color: "var(--red)" }}>{item.role}</small>
          </div>
        ))}
      </div>
    </aside>
  );
}

function App() {
  const [user, setUser] = useState(getUser());

  if (!user) return <AuthScreen onAuth={setUser} />;

  return (
    <div className="app">
      <header className="app-top" style={{ minHeight: "58px", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 24px", borderBottom: "1px solid var(--line)", background: "rgba(0, 0, 0, .84)", backdropFilter: "blur(14px)", sticky: "top", zIndex: 100 }}>
        <strong style={{ fontFamily: "var(--font-heading)", letterSpacing: "1px", fontSize: "18px" }}>
          FOX <span style={{ color: "var(--red)" }}>NET</span>
        </strong>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "var(--muted)" }}>Hola, {user.name}</span>
          <button style={{ padding: "6px 14px", background: "transparent", border: "1px solid var(--line)", color: "#fff", fontSize: "12px", fontWeight: "bold" }} onClick={() => { clearSession(); window.location.reload(); }}>
            Salir
          </button>
        </div>
      </header>
      <ChatPanel user={user} />
      <AdminPanel user={user} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
