import { useState } from "react";
import EmojiPicker from "emoji-picker-react";

export default function AccountsModal({
  connected,
  profile,
  onClose,
  refreshStatus,
}: any) {

  const [activeTab, setActiveTab] = useState("pretweet");
  const [pretweet, setPretweet] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const profilePic =
    connected && profile?.profile_image_url
      ? profile.profile_image_url.replace("_normal", "_400x400")
      : "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";

  const connectX = async () => {
    await window.api.startOAuth();
  };

  const disconnectX = async () => {
    await window.api.logout();
    localStorage.removeItem("twitter_profile");
    await refreshStatus();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center modal-backdrop z-50">
      <div className="crimson-card w-[800px] h-[520px] rounded-2xl shadow-xl flex overflow-hidden">

        {/* LEFT SIDE */}
        <div className="w-1/3 p-6 border-r border-white/10">

          <div className="flex flex-col items-center">
            <img
              src={profilePic}
              className="w-28 h-28 rounded-full border-4 border-black shadow-lg"
            />

            <h2 className="mt-4 text-xl font-bold">
              {connected ? profile?.name : "Not Connected"}
            </h2>

            <p className="text-gray-300 text-sm">
              {connected ? "@" + profile?.username : "X account not linked"}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {!connected ? (
              <button
                onClick={connectX}
                className="bg-blue-600 hover:bg-blue-700 py-2 rounded"
              >
                Connect X
              </button>
            ) : (
              <button
                onClick={disconnectX}
                className="bg-red-600 hover:bg-red-700 py-2 rounded"
              >
                Disconnect X
              </button>
            )}

            <button className="bg-gray-700 py-2 rounded opacity-40">
              Connect Twitch (Coming Soon)
            </button>
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
