// =======================
// App.tsx
// =======================

import { useEffect, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import AccountsModal from "./components/AccountsModal";

export default function App() {
  // TWITTER / X
  const [connected, setConnected] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // TWITCH
  const [twitchConnected, setTwitchConnected] = useState(false);
  const [twitchProfile, setTwitchProfile] = useState<any>(null);

  const [modalOpen, setModalOpen] = useState(false);

  // Tweet composer
  const [tweet, setTweet] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const MAX_CHARS = 280;

  const [popup, setPopup] = useState<null | { type: string; message: string }>(
    null
  );

  // ------------------------------------------------
  // Load cached profiles instantly
  // ------------------------------------------------
  const loadCache = () => {
    const tw = localStorage.getItem("twitter_profile");
    if (tw) setProfile(JSON.parse(tw));

    const t = localStorage.getItem("twitch_profile");
    if (t) setTwitchProfile(JSON.parse(t));
  };

  // ------------------------------------------------
  // Refresh both X + Twitch state
  // ------------------------------------------------
  const refreshStatus = async () => {
    // TWITTER
    const status = await window.api.getAuthStatus();
    setConnected(status.connected);

    if (status.connected) {
      const p = await window.api.getProfile();
      if (p?.username) {
        setProfile(p);
        localStorage.setItem("twitter_profile", JSON.stringify(p));
      }
    }

    // TWITCH
    const tStatus = await window.api.getTwitchAuthStatus();
    setTwitchConnected(tStatus.connected);

    if (tStatus.connected) {
      const tp = await window.api.getTwitchProfile();
      if (tp) {
        setTwitchProfile(tp);
        localStorage.setItem("twitch_profile", JSON.stringify(tp));
      }
    }
  };

  // ------------------------------------------------
  // Startup + event listeners
  // ------------------------------------------------
  useEffect(() => {
    loadCache();
    refreshStatus();

    // Twitter OAuth complete
    window.api.onOAuthComplete(async () => {
      await refreshStatus();
      setModalOpen(true);
    });

    // Twitch OAuth complete
    window.api.onTwitchOAuthComplete(async () => {
      await refreshStatus();
      setModalOpen(true);
    });

    // Auto profile from DOM scraper
    window.api.onAutoProfile((p) => {
      if (p?.username) {
        setProfile(p);
        localStorage.setItem("twitter_profile", JSON.stringify(p));
      }
    });
  }, []);

  // ------------------------------------------------
  // POST A TWEET
  // ------------------------------------------------
  const postTweet = async () => {
    if (!tweet.length) return;

    try {
      const result = await window.api.postTweet(tweet);

      if (result?.result?.startsWith("ERROR")) {
        setPopup({
          type: "error",
          message: "Tweet failed: Not logged in.",
        });
      } else {
        setPopup({
          type: "success",
          message: "Tweet sent successfully!",
        });
        setTweet("");
      }
    } catch {
      setPopup({
        type: "error",
        message: "Tweet failed to send.",
      });
    }

    setTimeout(() => setPopup(null), 2500);
  };

  return (
    <div className="p-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">X Desktop Client</h1>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-[#9A1535] hover:bg-[#B01A40]"
        >
          Accounts
        </button>
      </div>

      {/* COMPOSE TWEET */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Compose Tweet</h2>

        <div className="relative">
          <textarea
            value={tweet}
            onChange={(e) => setTweet(e.target.value)}
            maxLength={MAX_CHARS}
            placeholder="What's happening?"
            className="w-full p-4 rounded-lg bg-[#2a2b2f] outline-none resize-none"
            rows={5}
          />

          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="absolute bottom-3 right-3 text-2xl"
          >
            😊
          </button>

          {showEmoji && (
            <div className="absolute right-0 mt-2 z-50">
              <EmojiPicker
                theme="dark"
                onEmojiClick={(e) => setTweet(tweet + e.emoji)}
              />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-2">
          <span className="text-gray-400">
            {tweet.length}/{MAX_CHARS}
          </span>

          <button
            onClick={postTweet}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Post Tweet
          </button>
        </div>
      </div>

      {/* ACCOUNTS MODAL */}
      {modalOpen && (
        <AccountsModal
          connected={connected}
          profile={profile}
          twitchConnected={twitchConnected}
          twitchProfile={twitchProfile}
          refreshStatus={refreshStatus}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* POPUP */}
      {popup && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white
            ${popup.type === "success" ? "bg-green-600" : "bg-red-600"}
          `}
        >
          {popup.message}
        </div>
      )}
    </div>
  );
}
