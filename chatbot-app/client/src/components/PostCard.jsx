import { useState, useCallback, useRef, useEffect } from "react";
import Reactions from "./Reactions.jsx";
import VideoPlayer from "./VideoPlayer.jsx";
import MediaViewer from "./MediaViewer.jsx";

/**
 * PostCard - Modern social media post component.
 * Supports text, images (single/gallery), video, hashtags, reactions.
 * Includes hidden file inputs for photo/video upload with preview.
 */

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "ahora";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function HighlightedText({ text }) {
  if (!text) return null;
  const parts = text.split(/(#[\w\u00C0-\u024F]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("#") ? (
          <span key={i} className="post-hashtag">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default function PostCard({ post, onOpenMedia }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [reactions, setReactions] = useState(post.reactions || {});
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);
  const [shared, setShared] = useState(false);
  const cardRef = useRef(null);

  // File upload state
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Lazy load: observe visibility
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const images = (post.media || []).filter((m) => m.type === "image" || /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(m.src));
  const videos = (post.media || []).filter((m) => m.type === "video" || /\.(mp4|webm)(\?.*)?$/i.test(m.src));
  const audios = (post.media || []).filter((m) => m.type === "audio" || /\.(mp3|wav|ogg)(\?.*)?$/i.test(m.src));
  const allMedia = [...images, ...videos, ...audios];

  const openImageViewer = useCallback((idx) => {
    setViewerIndex(idx);
    setViewerOpen(true);
  }, []);

  const handleReact = useCallback((reaction, key) => {
    setReactions((prev) => {
      const updated = { ...prev };
      if (reaction) {
        updated[key] = (updated[key] || 0) + 1;
      } else {
        updated[key] = Math.max((updated[key] || 1) - 1, 0);
      }
      return updated;
    });
  }, []);

  const handleLike = useCallback(() => {
    setLiked((l) => !l);
  }, []);

  const handleShare = useCallback(() => {
    setShared((s) => !s);
  }, []);

  const handleComment = useCallback((e) => {
    e.preventDefault();
    if (!commentText.trim() && pendingFiles.length === 0) return;
    setComments((prev) => [...prev, {
      id: `c-${Date.now()}`,
      author: "Tu",
      text: commentText.trim(),
      time: new Date().toISOString(),
      media: pendingFiles.map((f) => ({ type: f.type, src: f.preview, name: f.name })),
    }]);
    setCommentText("");
    pendingFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    setPendingFiles([]);
  }, [commentText, pendingFiles]);

  const handleFileChange = useCallback((e, acceptedTypes) => {
    setUploadError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`"${file.name}" excede el límite de 50MB`);
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const isAudio = file.type.startsWith("audio/");

    if (!isImage && !isVideo && !isAudio) {
      setUploadError("Formato no soportado");
      return;
    }

    let fileType = "image";
    if (isVideo) fileType = "video";
    if (isAudio) fileType = "audio";

    // Avoid duplicates
    const isDuplicate = pendingFiles.some(
      (f) => f.name === file.name && f.size === file.size
    );
    if (isDuplicate) return;

    const entry = {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      name: file.name,
      size: file.size,
      type: fileType,
      preview: URL.createObjectURL(file),
    };

    setPendingFiles((prev) => [...prev, entry]);
    e.target.value = "";
  }, [pendingFiles]);

  const removePendingFile = useCallback((id) => {
    setPendingFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  if (!visible) {
    return <div className="post-card post-placeholder" ref={cardRef} />;
  }

  return (
    <article className="post-card" ref={cardRef}>
      {/* Header */}
      <header className="post-header">
        <div className="post-avatar" style={{ background: post.avatarColor || "var(--red)" }}>
          {post.avatarEmoji || "🦊"}
        </div>
        <div className="post-meta">
          <span className="post-author">{post.author}</span>
          <span className="post-handle">{post.handle}</span>
          <span className="post-dot">·</span>
          <time className="post-time">{timeAgo(post.date)}</time>
        </div>
      </header>

      {/* Content */}
      {post.text && (
        <div className="post-text">
          <HighlightedText text={post.text} />
        </div>
      )}

      {/* Media */}
      {images.length > 0 && (
        <div className={`post-images count-${Math.min(images.length, 4)}`}>
          {images.map((img, i) => (
            <div
              key={i}
              className="post-img-wrap"
              onClick={() => openImageViewer(i)}
            >
              <img
                src={img.src}
                alt={img.alt || ""}
                loading="lazy"
                className="post-img"
              />
            </div>
          ))}
        </div>
      )}

      {videos.map((vid, i) => (
        <div key={`v-${i}`} className="post-video">
          <VideoPlayer src={vid.src} poster={vid.poster} />
        </div>
      ))}

      {audios.map((aud, i) => (
        <div key={`a-${i}`} className="post-audio">
          <audio src={aud.src} controls className="w-full" style={{ width: "100%", marginTop: "10px", borderRadius: "8px", outline: "none" }} />
        </div>
      ))}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="post-tags">
          {post.hashtags.map((tag) => (
            <span key={tag} className="post-tag">#{tag}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="post-actions">
        <button className={`post-action ${liked ? "active" : ""}`} onClick={handleLike}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill={liked ? "var(--red)" : "currentColor"}>
            {liked
              ? <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              : <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
            }
          </svg>
          <span>{liked ? post.likes + 1 : post.likes}</span>
        </button>

        <button className="post-action" onClick={() => setShowComments(!showComments)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>{comments.length}</span>
        </button>

        <button className={`post-action ${shared ? "active" : ""}`} onClick={handleShare}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
          </svg>
          <span>{shared ? post.shares + 1 : post.shares}</span>
        </button>

        {/* Photo upload button */}
        <button
          className="post-action"
          onClick={() => photoInputRef.current?.click()}
          title="Adjuntar foto"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          <span>Foto</span>
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="post-file-input-hidden"
          onChange={(e) => handleFileChange(e, "image")}
        />

        {/* Video upload button */}
        <button
          className="post-action"
          onClick={() => videoInputRef.current?.click()}
          title="Adjuntar video"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
          </svg>
          <span>Video</span>
        </button>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg"
          className="post-file-input-hidden"
          onChange={(e) => handleFileChange(e, "video")}
        />

        {/* Audio upload button */}
        <button
          className="post-action"
          onClick={() => audioInputRef.current?.click()}
          title="Adjuntar audio"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
          <span>Audio</span>
        </button>
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/mp3,audio/wav,audio/ogg,audio/mpeg"
          className="post-file-input-hidden"
          onChange={(e) => handleFileChange(e, "audio")}
        />
      </div>

      {/* Upload error */}
      {uploadError && <div className="post-upload-error">{uploadError}</div>}

      {/* Pending file previews */}
      {pendingFiles.length > 0 && (
        <div className="post-pending-files">
          {pendingFiles.map((f) => (
            <div key={f.id} className="post-pending-item">
              {f.type === "image" ? (
                <img src={f.preview} alt={f.name} className="post-pending-thumb" />
              ) : f.type === "video" ? (
                <div className="post-pending-thumb post-pending-video-thumb">
                  <video src={f.preview} muted />
                  <span className="post-pending-play">▶</span>
                </div>
              ) : (
                <div className="post-pending-thumb post-pending-audio-thumb" style={{ display: "grid", placeItems: "center", background: "#222", border: "1px solid var(--line)" }}>
                  <span style={{ fontSize: "20px" }}>🎵</span>
                </div>
              )}
              <div className="post-pending-info">
                <span className="post-pending-name">{f.name}</span>
                <span className="post-pending-size">{formatSize(f.size)}</span>
              </div>
              <button
                className="post-pending-remove"
                onClick={() => removePendingFile(f.id)}
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Reactions */}
      <Reactions reactions={reactions} onReact={handleReact} />

      {/* Comments section */}
      {showComments && (
        <div className="post-comments">
          {comments.map((c) => (
            <div key={c.id} className="comment">
              <span className="comment-author">{c.author}</span>
              <span className="comment-text">{c.text}</span>
              {c.media && c.media.length > 0 && (
                <div className="comment-media">
                  {c.media.map((m, i) =>
                    m.type === "image" ? (
                      <img key={i} src={m.src} alt={m.name} className="comment-media-img" />
                    ) : m.type === "video" ? (
                      <video key={i} src={m.src} controls className="comment-media-video" />
                    ) : (
                      <audio key={i} src={m.src} controls className="comment-media-audio" style={{ display: "block", marginTop: "5px", width: "100%", maxWidth: "300px" }} />
                    )
                  )}
                </div>
              )}
            </div>
          ))}
          <form className="comment-form" onSubmit={handleComment}>
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe un comentario..."
            />
            <button type="submit">Enviar</button>
          </form>
        </div>
      )}

      {/* Media Viewer */}
      {allMedia.length > 0 && (
        <MediaViewer
          isOpen={viewerOpen}
          items={allMedia}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </article>
  );
}
