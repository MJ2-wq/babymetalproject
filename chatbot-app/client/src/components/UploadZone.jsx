  import { useState, useCallback, useRef } from "react";

/**
 * UploadZone - Drag-and-drop + file picker for images and videos.
 * Shows preview grid, file info, and remove buttons.
 * Accepts: jpg, png, gif, webp, mp4, webm, ogg.
 */

const ACCEPTED_TYPES = {
  "image/*": ["jpg", "jpeg", "png", "gif", "webp"],
  "video/*": ["mp4", "webm", "ogg"],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 6;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileType(file) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "unknown";
}

export default function UploadZone({ files, onFilesChange }) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const processFiles = useCallback((fileList) => {
    setError("");
    const newFiles = [];

    for (const file of fileList) {
      if (files.length + newFiles.length >= MAX_FILES) {
        setError(`Máximo ${MAX_FILES} archivos`);
        break;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} excede 50MB`);
        continue;
      }

      const type = getFileType(file);
      if (type === "unknown") {
        setError(`${file.name} no es un formato soportado`);
        continue;
      }

      // Check for duplicates by name + size
      const isDuplicate = [...files, ...newFiles].some(
        (f) => f.name === file.name && f.size === file.size
      );
      if (isDuplicate) continue;

      newFiles.push({
        id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        name: file.name,
        size: file.size,
        type,
        preview: URL.createObjectURL(file),
      });
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
    }
  }, [files, onFilesChange]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleInputChange = useCallback((e) => {
    processFiles(e.target.files);
    e.target.value = "";
  }, [processFiles]);

  const removeFile = useCallback((id) => {
    const removed = files.find((f) => f.id === id);
    if (removed) URL.revokeObjectURL(removed.preview);
    onFilesChange(files.filter((f) => f.id !== id));
  }, [files, onFilesChange]);

  return (
    <div className="upload-zone-wrap">
      {/* Drop area */}
      <div
        className={`upload-drop ${dragOver ? "drag-over" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleInputChange}
          className="upload-input-hidden"
        />
        <div className="upload-drop-icon">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
          </svg>
        </div>
        <span className="upload-drop-text">
          Arrastra fotos o videos aquí
        </span>
        <span className="upload-drop-sub">
          o haz clic para seleccionar
        </span>
        <span className="upload-drop-formats">
          JPG, PNG, GIF, WebP, MP4, WebM — Max 50MB
        </span>
      </div>

      {/* Error */}
      {error && <div className="upload-error">{error}</div>}

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="upload-previews">
          {files.map((f) => (
            <div key={f.id} className="upload-preview-item">
              {f.type === "image" ? (
                <img src={f.preview} alt={f.name} className="upload-preview-img" />
              ) : (
                <div className="upload-preview-video">
                  <video src={f.preview} muted />
                  <span className="upload-preview-play">▶</span>
                </div>
              )}
              <div className="upload-preview-info">
                <span className="upload-preview-name">{f.name}</span>
                <span className="upload-preview-size">{formatSize(f.size)}</span>
              </div>
              <button
                className="upload-preview-remove"
                onClick={() => removeFile(f.id)}
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
