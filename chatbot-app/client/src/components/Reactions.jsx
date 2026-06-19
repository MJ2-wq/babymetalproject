import { useState, useCallback } from "react";

/**
 * Reactions - Social reaction system (like Facebook/Twitter).
 * Options: ❤️ Love, 🔥 Metal, 🤘 Kitsune, 😂 Funny, 😮 Surprised
 * Shows per-reaction counts and total.
 */

const REACTION_TYPES = [
  { key: "love", emoji: "❤️", label: "Me encanta" },
  { key: "metal", emoji: "🔥", label: "Metal" },
  { key: "kitsune", emoji: "🤘", label: "Kitsune" },
  { key: "funny", emoji: "😂", label: "Divertido" },
  { key: "surprised", emoji: "😮", label: "Sorprendente" },
];

export default function Reactions({ reactions = {}, onReact }) {
  const [showPicker, setShowPicker] = useState(false);
  const [userReaction, setUserReaction] = useState(null);

  const total = Object.values(reactions).reduce((a, b) => a + b, 0);

  const handleReact = useCallback((key) => {
    const newReaction = userReaction === key ? null : key;
    setUserReaction(newReaction);
    setShowPicker(false);
    if (onReact) onReact(newReaction, key);
  }, [userReaction, onReact]);

  return (
    <div className="reactions">
      {/* Existing reaction counts */}
      {Object.entries(reactions).map(([key, count]) => {
        if (count <= 0) return null;
        const type = REACTION_TYPES.find((r) => r.key === key);
        if (!type) return null;
        return (
          <button
            key={key}
            className={`reaction-badge ${userReaction === key ? "active" : ""}`}
            onClick={() => handleReact(key)}
            title={type.label}
          >
            <span className="reaction-emoji">{type.emoji}</span>
            <span className="reaction-count">{count}</span>
          </button>
        );
      })}

      {/* Total count */}
      {total > 0 && <span className="reactions-total">{total}</span>}

      {/* Add reaction button */}
      <div className="reaction-add-wrap">
        <button
          className="reaction-add-btn"
          onClick={() => setShowPicker(!showPicker)}
          title="Añadir reacción"
        >
          +
        </button>

        {/* Reaction picker popup */}
        {showPicker && (
          <div className="reaction-picker">
            {REACTION_TYPES.map((type) => (
              <button
                key={type.key}
                className={`reaction-picker-btn ${userReaction === type.key ? "active" : ""}`}
                onClick={() => handleReact(type.key)}
                title={type.label}
              >
                <span className="reaction-picker-emoji">{type.emoji}</span>
                <span className="reaction-picker-label">{type.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { REACTION_TYPES };
