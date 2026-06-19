import { useState, useCallback } from "react";
import UploadZone from "./UploadZone.jsx";

/**
 * CreatePost - Post composer with file upload and text input.
 * Supports multiple images/videos with previews.
 * Extracts hashtags from text automatically.
 * Prepares file data with full metadata for backend upload.
 */

const QUICK_HASHTAGS = ["BABYMETAL", "MetalResistance", "FoxGod", "KawaiiMetal", "WorldTour2026"];

function cleanupFiles(fileList) {
  fileList.forEach((f) => URL.revokeObjectURL(f.preview));
}

export default function CreatePost({ user, onPost }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const extractHashtags = useCallback((content) => {
    const matches = content.match(/#([\w\u00C0-\u024F]+)/g);
    return matches ? matches.map((h) => h.slice(1)) : [];
  }, []);

  const handleSubmit = useCallback(() => {
    if (!text.trim() && files.length === 0) return;

    const media = files.map((f) => ({
      type: f.type,
      src: f.preview,
      alt: f.name,
      name: f.name,
      size: f.size,
      file: f.file,  // ← File object para FormData en el backend
    }));

    const post = {
      id: `user-${Date.now()}`,
      author: user?.name || "Fan",
      handle: `@${(user?.email || "fan").split("@")[0]}`,
      avatarEmoji: "🦊",
      avatarColor: "#ff0048",
      date: new Date().toISOString(),
      text: text.trim(),
      media,
      hashtags: extractHashtags(text),
      likes: 0,
      shares: 0,
      reactions: {},
      comments: [],
    };

    onPost(post);

    // Liberar ObjectURLs antes de limpiar
    cleanupFiles(files);
    setText("");
    setFiles([]);
    setExpanded(false);
  }, [text, files, user, onPost, extractHashtags]);

  const handleCancel = useCallback(() => {
    cleanupFiles(files);
    setText("");
    setFiles([]);
    setExpanded(false);
  }, [files]);

  const addHashtag = useCallback((tag) => {
    setText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return `#${tag}`;
      return `${trimmed} #${tag}`;
    });
  }, []);

  return (
    <div className={`create-post ${expanded ? "expanded" : ""}`}>
      {/* Header */}
      <div className="create-post-header">
        <div className="create-post-avatar">
          {user?.name?.[0]?.toUpperCase() || "🦊"}
        </div>
        <textarea
          className="create-post-input"
          placeholder="¿Qué está pasando en el mundo de BABYMETAL?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setExpanded(true)}
          rows={expanded ? 3 : 1}
        />
      </div>

      {/* Expanded section */}
      {expanded && (
        <>
          {/* Upload zone */}
          <UploadZone files={files} onFilesChange={setFiles} />

          {/* Quick hashtags */}
          <div className="create-post-hashtags">
            <span className="create-post-hashtags-label">Tags rápidos:</span>
            {QUICK_HASHTAGS.map((tag) => (
              <button
                key={tag}
                className="create-post-tag-btn"
                onClick={() => addHashtag(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Character count + actions */}
          <div className="create-post-footer">
            <span className={`create-post-count ${text.length > 2000 ? "over" : ""}`}>
              {text.length}/2000
            </span>
            <div className="create-post-actions">
              <button className="create-post-cancel" onClick={handleCancel}>
                Cancelar
              </button>
              <button
                className="create-post-submit"
                disabled={!text.trim() && files.length === 0}
                onClick={handleSubmit}
              >
                Publicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
