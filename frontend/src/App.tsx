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

  // ORIGINAL POPUP — unchanged
  const [popup, setPopup] = useState<null | { type: string; message: string }>(
    null
  );

  // Load cached profile instantly
  const loadCachedProfile = () => {
    const cached = localStorage.getItem("twitter_profile");
    if (cached) {
      try {
        setProfile(JSON.parse(cached));
      } catch {}
    }
  };

  // Refresh backend state
  const refreshStatus = async () => {
    const status = await window.api.getAuthStatus();
    setConnected(status.connected);

    if (status.connected) {
      const p = await window.api.getProfile();
      if (p?.username) {
        localStorage.setItem("twitter_profile", JSON.stringify(p));
        setProfile(p);
      }
    }
  };

  useEffect(() => {
    loadCachedProfile();
    refreshStatus();

    // When backend confirms OAuth completed
    window.api.onOAuthComplete(async () => {
      console.log("OAuth complete → refreshing");
      await refreshStatus();
      setModalOpen(true);
    });

    // Auto-profile FROM SCRAPER (always allowed!)
    window.api.onAutoProfile((p) => {
      console.log("AUTO PROFILE RECEIVED:", p);

      if (p?.username) {
        localStorage.setItem("twitter_profile", JSON.stringify(p));
        setProfile(p);
      }
    });
  }, []);

  // POST TWEET (popup unchanged)
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

      {/* MODAL */}
      {modalOpen && (
        <AccountsModal
          connected={connected}
          profile={profile}
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
