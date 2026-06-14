import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { api, clearSession, getUser, setSession } from "./lib/api.js";
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

function Sidebar({ conversations, activeId, onSelect, onNew }) {
  return (
    <aside className="sidebar">
      <div className="side-head">
        <strong>FOX BOT</strong>
        <button onClick={onNew}>Nuevo</button>
      </div>
      <div className="conversation-list">
        {conversations.map((item) => (
          <button
            key={item.id}
            className={item.id === activeId ? "conversation active" : "conversation"}
            onClick={() => onSelect(item.id)}
          >
            <span>{item.title}</span>
            <small>{new Date(item.updated_at).toLocaleString()}</small>
          </button>
        ))}
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
    <section className="chat-shell">
      <Sidebar conversations={conversations} activeId={activeId} onSelect={loadMessages} onNew={() => { setActiveId(null); setMessages([]); }} />
      <main className="chat-card">
        <header className="chat-header">
          <div className="fox-avatar">🦊</div>
          <div>
            <h1>FOX BOT</h1>
            <span>En linea</span>
          </div>
        </header>
        <div className="quick-row">
          {["todas las giras", "Quienes son?", "Canciones", "Conciertos", "Fox God", "Historia"].map((q) => (
            <button key={q} onClick={() => sendMessage(q)}>{q}</button>
          ))}
        </div>
        <div className="messages">
          {!messages.length && (
            <div className="welcome">
              <h2>Bienvenido, {user.name}</h2>
              <p>Pregunta por giras, canciones, historia, integrantes o usa FOX BOT como asistente para tu fanpage.</p>
            </div>
          )}
          {messages.map((message) => (
            <article key={message.id} className={`message ${message.role}`}>
              <div className="message-label">{message.role === "assistant" ? "🦊 FOX BOT" : "Tu"}</div>
              <p>{message.content}</p>
            </article>
          ))}
          {typing && <div className="typing">La IA esta escribiendo...</div>}
          <div ref={bottomRef} />
        </div>
        <form className="input-bar" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu pregunta..." />
          <button type="submit">➤</button>
        </form>
      </main>
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
    <aside className="admin-panel">
      <h2>Admin</h2>
      {stats && (
        <div className="admin-stats">
          <span>{stats.users} usuarios</span>
          <span>{stats.conversations} chats</span>
          <span>{stats.messages} mensajes</span>
        </div>
      )}
      <div className="admin-users">
        {users.map((item) => (
          <div key={item.id}>{item.name} <small>{item.role}</small></div>
        ))}
      </div>
    </aside>
  );
}

function App() {
  const [user, setUser] = useState(getUser());
  const appClass = useMemo(() => user?.role === "admin" ? "app with-admin" : "app", [user]);

  if (!user) return <AuthScreen onAuth={setUser} />;

  return (
    <div className={appClass}>
      <div className="app-top">
        <strong>BABYMETAL FOX BOT</strong>
        <button onClick={() => { clearSession(); setUser(null); }}>Salir</button>
      </div>
      <ChatPanel user={user} />
      <AdminPanel user={user} />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
