// =======================
// AccountsModal.tsx
// =======================

import { useState } from "react";
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

  // ------------------------------
  // X PROFILE IMAGE
  // ------------------------------
  const profilePic =
    connected && profile?.profile_image_url
      ? profile.profile_image_url.replace("_normal", "_400x400")
      : "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";

  // ------------------------------
  // TWITCH PROFILE IMAGE
  // ------------------------------
  const twitchPic =
    twitchConnected && twitchProfile?.profile_image_url
      ? twitchProfile.profile_image_url
      : "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_70x70.png";

  // ------------------------------
  // X AUTH BUTTONS
  // ------------------------------
  const connectX = async () => {
    await window.api.startOAuth();
  };

  const disconnectX = async () => {
    await window.api.logout();
    localStorage.removeItem("twitter_profile");
    await refreshStatus();
  };

  // ------------------------------
  // TWITCH AUTH BUTTONS
  // ------------------------------
  const connectTwitch = async () => {
    await window.api.startTwitchOAuth();
  };

  const disconnectTwitch = async () => {
    await window.api.logoutTwitch();
    localStorage.removeItem("twitch_profile");
    await refreshStatus();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center modal-backdrop z-50">
      <div className="crimson-card w-[900px] h-[540px] rounded-2xl shadow-xl flex overflow-hidden">


{/* LEFT SIDE */}
<div className="w-1/3 p-6 border-r border-white/10 flex flex-col justify-start">

  {/* X PROFILE */}
  <div className="flex flex-col items-center">
    <img
      src={profilePic}
      className="w-24 h-24 rounded-full border-4 border-black shadow-lg"
    />

    <h2 className="mt-3 text-xl font-bold">
      {connected ? profile?.name : "Not Connected"}
    </h2>

    <p className="text-gray-300 text-sm mb-3">
      {connected ? "@" + profile?.username : "X account not linked"}
    </p>

    {/* X BUTTON */}
    <div className="w-full">
      {!connected ? (
        <button
          onClick={connectX}
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded"
        >
          Connect X
        </button>
      ) : (
        <button
          onClick={disconnectX}
          className="w-full bg-red-600 hover:bg-red-700 py-2 rounded"
        >
          Disconnect X
        </button>
      )}
    </div>
  </div>

  {/* TIGHTER SEPARATOR */}
  <div className="my-4 border-t border-white/10 w-full"></div>

  {/* TWITCH PROFILE */}
  <div className="flex flex-col items-center mt-2">
    <img
      src={twitchPic}
      className="w-24 h-24 rounded-full border-4 border-purple-700 shadow-lg"
    />

    <h2 className="mt-3 text-lg font-bold text-purple-300">
      {twitchConnected
        ? (twitchProfile.display_name || twitchProfile.name)
        : "Twitch Not Connected"}
    </h2>

    {twitchConnected && (
      <p className="text-gray-400 text-sm mb-3">
        @{twitchProfile.login || twitchProfile.name}
      </p>
    )}

    {/* TWITCH BUTTON */}
    <div className="w-full">
      {!twitchConnected ? (
        <button
          onClick={connectTwitch}
          className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded"
        >
          Connect Twitch
        </button>
      ) : (
        <button
          onClick={disconnectTwitch}
          className="w-full bg-red-600 hover:bg-red-700 py-2 rounded"
        >
          Disconnect Twitch
        </button>
      )}
    </div>
  </div>
</div>



       

        {/* RIGHT SIDE */}
        <div className="w-2/3 p-6">
          {/* Tabs */}
          <div className="flex gap-6 mb-4 border-b border-white/10 pb-3">
            <button
              onClick={() => setActiveTab("pretweet")}
              className={activeTab === "pretweet" ? "font-bold" : ""}
            >
              Pre-Tweet
            </button>

            <button
              onClick={() => setActiveTab("activity")}
              className={activeTab === "activity" ? "font-bold" : ""}
            >
              Activity
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={activeTab === "settings" ? "font-bold" : ""}
            >
              Settings
            </button>
          </div>

          {/* PRETWEET */}
          {activeTab === "pretweet" && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Pre-Tweet Message</h3>

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
            </div>
          )}

          {activeTab === "activity" && (
            <p className="text-gray-300">Activity log coming soon…</p>
          )}

          {activeTab === "settings" && (
            <p className="text-gray-300">More settings coming soon…</p>
          )}
        </div>

        <button
          className="absolute top-4 right-4 text-xl text-gray-300 hover:text-white"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
