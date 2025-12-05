import { useEffect, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import AccountsModal from "./components/AccountsModal";

export default function App() {
  const [connected, setConnected] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [tweet, setTweet] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const MAX_CHARS = 280;

  // ⭐ ORIGINAL POPUP
  const [popup, setPopup] = useState<null | { type: string; message: string }>(
    null
  );

  // ---------------- REFRESH STATUS ----------------
  const refreshStatus = async () => {
    const res = await window.api.getAuthStatus();
    setConnected(res.connected === true);

    if (res.connected) {
      const p = await window.api.getProfile();
      if (p?.username) {
        setProfile(p);
        localStorage.setItem("twitter_profile", JSON.stringify(p));
      }
    } else {
      setProfile(null);
      localStorage.removeItem("twitter_profile");
    }
  };

  // Load cached profile instantly (safe)
  const loadCached = () => {
    const c = localStorage.getItem("twitter_profile");
    if (c) setProfile(JSON.parse(c));
  };

  useEffect(() => {
    loadCached();
    refreshStatus();

    // ⭐ When OAuth finishes
    window.api.onOAuthComplete(() => {
      console.log("OAuth complete → refreshing status + reopening modal");
      refreshStatus();
      setModalOpen(true);
    });

    // ⭐ One-line fix: Ignore auto-profile until the user is authenticated
    window.api.onAutoProfile((p) => {
      if (!connected) return; // ← FIX

      console.log("Auto-profile received:", p);

      if (p?.username) {
        localStorage.setItem("twitter_profile", JSON.stringify(p));
        setProfile(p);
      }
    });
  }, [connected]);

  // ---------------- SEND TWEET ----------------
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
    } catch (err) {
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
            className="w-full p-4 rounded-lg bg-[#2a2b2f] outline-none resize-none"
            rows={5}
            placeholder="What's happening?"
          />

          {/* Emoji Button */}
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="absolute bottom-3 right-3 text-2xl"
          >
            😊
          </button>

          {/* Emoji Picker */}
          {showEmoji && (
            <div className="absolute right-0 mt-2 z-50">
              <EmojiPicker
                theme="dark"
                onEmojiClick={(e) => setTweet(tweet + e.emoji)}
              />
            </div>
          )}
        </div>

        {/* Counter + Send */}
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
          refreshStatus={refreshStatus}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* ⭐ ORIGINAL POPUP */}
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
