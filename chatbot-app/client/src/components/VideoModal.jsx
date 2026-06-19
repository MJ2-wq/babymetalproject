import { useEffect, useRef } from "react";

function extractYouTubeId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/v\/([^?]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function VideoModal({ isOpen, videoUrl, onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !videoUrl) return null;

  const ytId = extractYouTubeId(videoUrl);
  const isDirect = /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl);

  return (
    <div
      className="video-modal-overlay"
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="video-modal-container">
        <button className="video-modal-close" onClick={onClose}>
          ✕
        </button>
        {ytId ? (
          <iframe
            className="video-modal-iframe"
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : isDirect ? (
          <video
            className="video-modal-player"
            src={videoUrl}
            controls
            autoPlay
          />
        ) : (
          <div className="video-modal-error">
            Formato de video no soportado
          </div>
        )}
      </div>
    </div>
  );
}
