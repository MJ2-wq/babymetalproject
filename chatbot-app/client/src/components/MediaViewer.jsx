import { useEffect, useRef, useState, useCallback } from "react";

/**
 * MediaViewer - Unified media viewer for images, videos, and galleries.
 * Supports zoom (mouse wheel + pinch), drag, keyboard navigation,
 * and responsive design. Consistent experience across all media types.
 */
export default function MediaViewer({ isOpen, items = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const overlayRef = useRef(null);
  const imgRef = useRef(null);
  const lastTouchDist = useRef(null);

  const item = items[currentIndex];
  const isVideo = item?.type === "video";
  const isImage = item?.type === "image" || (!item?.type && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(item?.src));
  const hasGallery = items.length > 1;

  const resetView = useCallback(() => {
    setZoom(1);
    setDrag({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetView();
    }
  }, [isOpen, initialIndex, resetView]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (hasGallery) {
        if (e.key === "ArrowLeft") setCurrentIndex((p) => (p > 0 ? p - 1 : items.length - 1));
        if (e.key === "ArrowRight") setCurrentIndex((p) => (p < items.length - 1 ? p + 1 : 0));
      }
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.25, 5));
      if (e.key === "-") setZoom((z) => Math.max(z - 0.25, 0.5));
      if (e.key === "0") resetView();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, hasGallery, items.length, resetView]);

  useEffect(() => {
    resetView();
  }, [currentIndex, resetView]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom((z) => Math.min(Math.max(z + delta, 0.5), 5));
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / lastTouchDist.current;
      setZoom((z) => Math.min(Math.max(z * scale, 0.5), 5));
      lastTouchDist.current = dist;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = null;
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = { ...drag };
  }, [zoom, drag]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setDrag({
      x: dragOffset.current.x + dx,
      y: dragOffset.current.y + dy,
    });
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((p) => (p < items.length - 1 ? p + 1 : 0));
  }, [items.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((p) => (p > 0 ? p - 1 : items.length - 1));
  }, [items.length]);

  if (!isOpen || !item) return null;

  return (
    <div
      className="mv-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Close */}
      <button className="mv-close" onClick={onClose}>✕</button>

      {/* Counter */}
      {hasGallery && (
        <div className="mv-counter">{currentIndex + 1} de {items.length}</div>
      )}

      {/* Navigation arrows */}
      {hasGallery && (
        <>
          <button className="mv-nav mv-prev" onClick={goPrev}>‹</button>
          <button className="mv-nav mv-next" onClick={goNext}>›</button>
        </>
      )}

      {/* Media content */}
      <div className="mv-content">
        {isVideo ? (
          <video
            className="mv-video"
            src={item.src}
            controls
            autoPlay
            playsInline
          />
        ) : (
          <div
            className="mv-image-wrap"
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            style={{ cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default" }}
          >
            <img
              ref={imgRef}
              className="mv-image"
              src={item.src}
              alt={item.alt || "Imagen"}
              draggable={false}
              style={{
                transform: `scale(${zoom}) translate(${drag.x / zoom}px, ${drag.y / zoom}px)`,
                transition: dragging ? "none" : "transform 0.2s ease",
              }}
            />
          </div>
        )}
      </div>

      {/* Thumbnails for galleries */}
      {hasGallery && items.length <= 12 && (
        <div className="mv-thumbs">
          {items.map((it, i) => (
            <button
              key={i}
              className={`mv-thumb ${i === currentIndex ? "active" : ""}`}
              onClick={() => setCurrentIndex(i)}
            >
              {it.type === "video" ? (
                <span className="mv-thumb-play">▶</span>
              ) : (
                <img src={it.thumb || it.src} alt="" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Zoom controls */}
      {!isVideo && (
        <div className="mv-zoom">
          <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}>−</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(z + 0.25, 5))}>+</button>
          {zoom !== 1 && <button onClick={resetView}>Reset</button>}
        </div>
      )}
    </div>
  );
}
