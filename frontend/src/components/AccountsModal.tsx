// =======================
// AccountsModal.tsx
// =======================

import { useState, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";

export default function AccountsModal({
  connected,
  profile,
  twitchConnected,
  twitchProfile,
  onClose,
  refreshStatus,
}: any) {
  const [activeTab, setActiveTab] = useState("pretweet");
  const [pretweet, setPretweet] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const [platforms, setPlatforms] = useState<string[]>([]);
  const [selectPlatformsOpen, setSelectPlatformsOpen] = useState(false);
  const [savedPopup, setSavedPopup] = useState(false);

  // ------------------------------------------------
  // LOAD PRETWEET FROM BACKEND
  // ------------------------------------------------
  useEffect(() => {
    (async () => {
      const saved = await window.api.pretweetLoad();

      if (saved?.text) setPretweet(saved.text);

      if (saved?.platforms) {
        try {
          const parsed = JSON.parse(saved.platforms);
          if (Array.isArray(parsed)) setPlatforms(parsed);
        } catch {
          setPlatforms([]);
        }
      }
    })();
  }, []);

  // ------------------------------------------------
  // SAVE PRETWEET
  // ------------------------------------------------
  const savePretweet = async () => {
    if (!pretweet.trim()) return;
    if (!twitchConnected) return;
    if (platforms.length === 0) return;

    await window.api.pretweetSave({
      text: pretweet,
      platforms: JSON.stringify(platforms),
    });

    setSavedPopup(true);
    setTimeout(() => setSavedPopup(false), 2000);
  };

  // UI VARIABLES
  const profilePic =
    connected && profile?.profile_image_url
      ? profile.profile_image_url.replace("_normal", "_400x400")
      : "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";

  const twitchPic =
    twitchConnected && twitchProfile?.profile_image_url
      ? twitchProfile.profile_image_url
      : "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_70x70.png";

  const togglePlatform = () => {
    if (!connected) return; // cannot select X unless logged in

    setPlatforms((prev) =>
      prev.includes("x") ? prev.filter((p) => p !== "x") : [...prev, "x"]
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center modal-backdrop z-50">
      <div className="crimson-card w-[900px] h-[540px] rounded-2xl shadow-xl flex overflow-hidden">

        {/* LEFT COLUMN */}
        <div className="w-1/3 p-6 border-r border-white/10 flex flex-col justify-start">

          {/* X PROFILE BLOCK */}
          <div className="flex flex-col items-center">
            <img src={profilePic} className="w-24 h-24 rounded-full border-4 border-black" />

            <h2 className="mt-3 text-xl font-bold">
              {connected ? profile?.name : "Not Connected"}
            </h2>

            <p className="text-gray-300 text-sm mb-3">
              {connected ? "@" + profile.username : "X account not linked"}
            </p>

            <div className="w-full">
              {!connected ? (
                <button
                  onClick={() => window.api.startOAuth()}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded"
                >
                  Connect X
                </button>
              ) : (
                <button
                  onClick={async () => {
                    await window.api.logout();
                    localStorage.removeItem("twitter_profile");
                    await refreshStatus();
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 py-2 rounded"
                >
                  Disconnect X
                </button>
              )}
            </div>
          </div>

          <div className="my-4 border-t border-white/10 w-full"></div>

          {/* TWITCH PROFILE BLOCK */}
          <div className="flex flex-col items-center mt-2">
            <img src={twitchPic} className="w-24 h-24 rounded-full border-4 border-purple-700" />

            <h2 className="mt-3 text-lg font-bold text-purple-300">
              {twitchConnected ? twitchProfile.display_name : "Twitch Not Connected"}
            </h2>

            <p className="text-gray-400 text-sm mb-3">
              {twitchConnected ? "@" + twitchProfile.login : ""}
            </p>

            <div className="w-full">
              {!twitchConnected ? (
                <button
                  onClick={() => window.api.startTwitchOAuth()}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded"
                >
                  Connect Twitch
                </button>
              ) : (
                <button
                  onClick={async () => {
                    await window.api.logoutTwitch();
                    localStorage.removeItem("twitch_profile");
                    await refreshStatus();
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 py-2 rounded"
                >
                  Disconnect Twitch
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-2/3 p-6">
          <div className="flex gap-6 mb-4 border-b border-white/10 pb-3">
            <button
              onClick={() => setActiveTab("pretweet")}
              className={activeTab === "pretweet" ? "font-bold" : ""}
            >
              Pre-Tweet
            </button>
          </div>

          {/* PRETWEET TAB */}
          {activeTab === "pretweet" && (
            <div>
              <textarea
                value={pretweet}
                onChange={(e) => setPretweet(e.target.value)}
                className="w-full p-3 rounded bg-[#2a2b2f]"
                rows={5}
              />

              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-400">{pretweet.length}/280</span>

                <button
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="px-3 py-1 bg-gray-700 rounded"
                >
                  😄 Emoji
                </button>
              </div>

              {showEmoji && (
                <div className="mt-2 bg-black/40 p-2 rounded w-[250px]">
                  <EmojiPicker
                    theme="dark"
                    onEmojiClick={(e) => setPretweet(pretweet + e.emoji)}
                  />
                </div>
              )}

              <button
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                onClick={() => setSelectPlatformsOpen(true)}
              >
                Select Platforms
              </button>

              <p className="text-sm text-gray-400 mt-2">
                Selected: {platforms.join(", ") || "None"}
              </p>

              <button
                onClick={savePretweet}
                disabled={!pretweet.trim() || !twitchConnected || platforms.length === 0}
                className={`mt-4 px-4 py-2 rounded text-white ${
                  !pretweet.trim() || !twitchConnected || platforms.length === 0
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                Save Pre-Tweet
              </button>
            </div>
          )}
        </div>

        <button
          className="absolute top-4 right-4 text-xl text-gray-300 hover:text-white"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* PLATFORM SELECTOR */}
      {selectPlatformsOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
          <div className="bg-[#2a2b2f] p-6 rounded-xl w-[350px]">
            <h3 className="text-xl font-bold mb-4">Choose Platforms</h3>

            {/* X REQUIREMENT FIX */}
            <label className="flex items-center gap-3 mb-3 opacity-100">
              <input
                type="checkbox"
                checked={platforms.includes("x")}
                disabled={!connected}
                onChange={togglePlatform}
              />
              <span className={!connected ? "text-gray-500" : ""}>
                X (Twitter)
              </span>
            </label>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setSelectPlatformsOpen(false)}
                className="px-3 py-2 bg-gray-700 rounded"
              >
                Cancel
              </button>

              <button
                onClick={() => setSelectPlatformsOpen(false)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {savedPopup && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white bg-green-600 z-[999]">
          Pre-tweet saved!
        </div>
      )}
    </div>
  );
}
