import { useState, useCallback } from "react";
import PostCard from "./PostCard.jsx";
import CreatePost from "./CreatePost.jsx";

/**
 * Feed - Main feed component displaying posts in social media style.
 * Includes sample BABYMETAL-themed posts and user-created posts.
 */

const SAMPLE_POSTS = [
  {
    id: "p1",
    author: "BABYMETAL",
    handle: "@BABYMETAL_jp",
    avatarEmoji: "🦊",
    avatarColor: "#ff0048",
    date: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    text: "🦊 THE OTHER ONE - World Tour 2026 continues! Next stop: Tokyo Dome 🇯🇵 #BABYMETAL #TheOtherOne #WorldTour2026",
    media: [
      { type: "image", src: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80", alt: "Concierto BABYMETAL" },
    ],
    hashtags: ["BABYMETAL", "TheOtherOne", "WorldTour2026"],
    likes: 4823,
    shares: 1205,
    reactions: { love: 2100, metal: 1800, kitsune: 923 },
  },
  {
    id: "p2",
    author: "Su-metal FC",
    handle: "@sumetal_fan",
    avatarEmoji: "⭐",
    avatarColor: "#9333ea",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    text: "La voz de Su-metal en Rondo of Nightmare en vivo es simplemente sobrenatural. Esta mujer no es de este planeta 🤘✨ #Su-metal #BABYMETAL",
    media: [
      { type: "video", src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    ],
    hashtags: ["Su-metal", "BABYMETAL"],
    likes: 892,
    shares: 234,
    reactions: { love: 450, metal: 280, kitsune: 162 },
  },
  {
    id: "p3",
    author: "Fox God Army",
    handle: "@foxgod_army",
    avatarEmoji: "🤘",
    avatarColor: "#dc2626",
    date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    text: "Galería del ensayo general de BABYMETAL en el Budokan. Cada detalle es PERFECCIÓN. 🔥 #KawaiiMetal #FoxGod #Budokan",
    media: [
      { type: "image", src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80", alt: "Escenario 1" },
      { type: "image", src: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&q=80", alt: "Escenario 2" },
      { type: "image", src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80", alt: "Escenario 3" },
    ],
    hashtags: ["KawaiiMetal", "FoxGod", "Budokan"],
    likes: 1567,
    shares: 489,
    reactions: { love: 680, metal: 520, kitsune: 367 },
  },
  {
    id: "p4",
    author: "Metal News",
    handle: "@metalnews_global",
    avatarEmoji: "📰",
    avatarColor: "#0891b2",
    date: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    text: "🔥 BREAKING: BABYMETAL confirma colaboración con una banda de metal europea para el próximo álbum. ¡El kawaii metal va a explotar! #MetalNews #BABYMETAL #NewMusic",
    media: [],
    hashtags: ["MetalNews", "BABYMETAL", "NewMusic"],
    likes: 3241,
    shares: 876,
    reactions: { love: 1200, metal: 1500, surprised: 541 },
  },
  {
    id: "p5",
    author: "Kawaii Metal Club",
    handle: "@kawaii_metal",
    avatarEmoji: "🌸",
    avatarColor: "#ec4899",
    date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    text: "¿Cuál es tu canción favorita de BABYMETAL para empezar el día? Yo elijo Karate 💪🐼 #BABYMETAL #Karate #KawaiiMetal",
    media: [
      { type: "image", src: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80", alt: "Música" },
    ],
    hashtags: ["BABYMETAL", "Karate", "KawaiiMetal"],
    likes: 678,
    shares: 123,
    reactions: { love: 340, kitsune: 198, funny: 140 },
  },
  {
    id: "p6",
    author: "Kami Band Fan",
    handle: "@kamiband_solos",
    avatarEmoji: "🎸",
    avatarColor: "#4b5563",
    date: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    text: "Escuchando este increíble solo instrumental inspirado en el Kami Band de BABYMETAL. ¡Una obra maestra de la guitarra! 🤘🎸 #KamiBand #GuitarSolo #BABYMETAL",
    media: [
      { type: "audio", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", name: "Kami Band Inspired Solo.mp3" }
    ],
    hashtags: ["KamiBand", "GuitarSolo", "BABYMETAL"],
    likes: 1234,
    shares: 412,
    reactions: { love: 800, metal: 434 }
  }
];

export default function Feed({ user }) {
  const [userPosts, setUserPosts] = useState([]);

  const handleNewPost = useCallback((post) => {
    setUserPosts((prev) => [post, ...prev]);
  }, []);

  const allPosts = [...userPosts, ...SAMPLE_POSTS];

  return (
    <div className="feed">
      <CreatePost user={user} onPost={handleNewPost} />
      {allPosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
