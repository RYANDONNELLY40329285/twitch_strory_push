// =======================
// AccountsModal.tsx (AUTO-SAVE PRETWEET VERSION)
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

  const [enabled, setEnabled] = useState(true);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [selectPlatformsOpen, setSelectPlatformsOpen] = useState(false);
  const [toggleLock, setToggleLock] = useState(false);

  const [autoSaveStatus, setAutoSaveStatus] =
    useState<"idle" | "saving" | "saved" | "error">("idle");

  // ======================================================
  // LOAD PRETWEET DATA
  // ======================================================
  useEffect(() => {
    (async () => {
      const saved = await window.api.pretweetLoad();

      if (saved?.text) setPretweet(saved.text);

      if (saved?.platforms) {
        try {
          setPlatforms(JSON.parse(saved.platforms));
        } catch {
          setPlatforms([]);
        }
      }

      if (typeof saved?.enabled === "boolean") {
        setEnabled(saved.enabled);
      }
    })();
  }, []);

  // ======================================================
  // DISABLE IF TWITCH DISCONNECTS
  // ======================================================
  useEffect(() => {
    if (!twitchConnected) {
      setEnabled(false);
      window.api.pretweetSetEnabled(false).catch(() => {});
    }
  }, [twitchConnected]);

  // ======================================================
  // AUTO-REGISTER TWITCH EVENTSUB
  // ======================================================
  useEffect(() => {
    if (!twitchConnected) return;

    (async () => {
      try {
        const res = await fetch("http://localhost:8080/api/twitch/auth/profile");
        const twitch = await res.json();

        if (!twitch?.username) return;

        localStorage.setItem("twitch_username", twitch.username);

        const tunnelUrl =
          localStorage.getItem("tunnel_url") ||
          "https://dbe1e3451948c8.lhr.life";

        const callbackUrl = `${tunnelUrl}/api/webhooks/twitch/callback`;

        const url =
          `http://localhost:8080/api/webhooks/twitch/register` +
          `?username=${twitch.username}&callbackUrl=${callbackUrl}`;

        await fetch(url, { method: "POST" });
      } catch (err) {
        console.error("❌ Failed to auto-register EventSub:", err);
      }
    })();
  }, [twitchConnected]);

  // ======================================================
  // AUTO-SAVE PRETWEET (DEBOUNCED)
  // ======================================================
const persistPretweet = async () => {
  if (!twitchConnected) return; // cannot save without auth context

  try {
    setAutoSaveStatus("saving");

    await window.api.pretweetSave({
      text: pretweet,                       // allow empty
      platforms: JSON.stringify(platforms), // allow []
      enabled: enabled && platforms.length > 0,
    });

    setAutoSaveStatus("saved");
    setTimeout(() => setAutoSaveStatus("idle"), 1500);
  } catch {
    setAutoSaveStatus("error");
  }
};

  useEffect(() => {
    if (!twitchConnected || !enabled) return;

    const timeout = setTimeout(() => {
      persistPretweet();
    }, 700);

    return () => clearTimeout(timeout);
  }, [pretweet, platforms, enabled, twitchConnected]);

  // ======================================================
  // TOGGLE ENABLED
  // ======================================================
  const toggleEnabled = async () => {
    if (toggleLock) return;

    setToggleLock(true);
    const newVal = !enabled;
    setEnabled(newVal);

    try {
      await window.api.pretweetSetEnabled(newVal);
    } catch {
      setEnabled(enabled);
    }

    setTimeout(() => setToggleLock(false), 300);
  };

  // ======================================================
  // PROFILE IMAGES
  // ======================================================
  const profilePic =
    connected && profile?.profile_image_url
      ? profile.profile_image_url.replace("_normal", "_400x400")
      : "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";

  const twitchPic =
    twitchConnected && twitchProfile?.profile_image_url
      ? twitchProfile.profile_image_url
      : "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_70x70.png";

  const disabledUI = !enabled || !twitchConnected;

  // ======================================================
  // DISCONNECT X
  // ======================================================
  const disconnectX = async () => {
    await window.api.logout();
    localStorage.removeItem("twitter_profile");

    const updatedPlatforms = platforms.filter((p) => p !== "x");
    setPlatforms(updatedPlatforms);

    await window.api.pretweetSave({
      text: pretweet,
      platforms: JSON.stringify(updatedPlatforms),
      enabled,
    });

    await refreshStatus();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center modal-backdrop z-50">
      <div className="crimson-card w-[900px] h-[540px] rounded-2xl shadow-xl flex overflow-hidden relative">

        {/* LEFT SIDE */}
        <div className="w-1/3 p-6 border-r border-white/10 flex flex-col">

          {/* X PROFILE */}
          <div className="flex flex-col items-center">
            <img src={profilePic} className="w-24 h-24 rounded-full border-4 border-black" />

            <h2 className="mt-3 text-xl font-bold">
              {connected ? profile?.name : "Not Connected"}
            </h2>

            <p className="text-gray-300 text-sm mb-3">
              {connected ? "@" + profile?.username : "X account not linked"}
            </p>

            {!connected ? (
              <button
                onClick={() => window.api.startOAuth()}
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

          <div className="my-4 border-t border-white/10"></div>

          {/* TWITCH PROFILE */}
          <div className="flex flex-col items-center">
            <img src={twitchPic} className="w-24 h-24 rounded-full border-4 border-purple-700" />

            <h2 className="mt-3 text-lg font-bold text-purple-300">
              {twitchConnected
                ? twitchProfile.display_name || twitchProfile.name
                : "Twitch Not Connected"}
            </h2>

            {twitchConnected && (
              <p className="text-gray-400 text-sm mb-3">
                @{twitchProfile.login || twitchProfile.name}
              </p>
            )}

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

        {/* RIGHT SIDE */}
        <div className="w-2/3 p-6">

          {/* TABS */}
          <div className="flex gap-6 mb-4 border-b border-white/10 pb-3">
            <button onClick={() => setActiveTab("pretweet")} className={activeTab === "pretweet" ? "font-bold" : ""}>Pre-Tweet</button>
            <button onClick={() => setActiveTab("activity")} className={activeTab === "activity" ? "font-bold" : ""}>Activity</button>
            <button onClick={() => setActiveTab("settings")} className={activeTab === "settings" ? "font-bold" : ""}>Settings</button>
          </div>

          {activeTab === "pretweet" && (
            <div className={disabledUI ? "opacity-40" : ""}>
              <h3 className="text-lg font-semibold mb-2">Pre-Tweet Message</h3>

              {/* ENABLE TOGGLE */}
              <label className="flex items-center gap-3 mb-4 cursor-pointer">
                <div
                  onClick={toggleEnabled}
                  className={`w-12 h-6 rounded-full ${enabled ? "bg-blue-600" : "bg-gray-600"}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full ${enabled ? "translate-x-6" : ""}`}></div>
                </div>
                <span>{enabled ? "Enabled" : "Disabled"}</span>
              </label>

              {/* TEXTAREA */}
              <div className="relative">
                <textarea
                  value={pretweet}
                  onChange={(e) => setPretweet(e.target.value)}
                  className="w-full p-3 rounded bg-[#2a2b2f]"
                  rows={5}
                  disabled={disabledUI}
                />

                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400">{pretweet.length}/280</span>
                  <span className="text-sm text-gray-400">
                    {autoSaveStatus === "saving" && "Saving…"}
                    {autoSaveStatus === "saved" && "✓ Saved"}
                    {autoSaveStatus === "error" && "⚠ Save failed"}
                  </span>
                </div>

                {showEmoji && !disabledUI && (
                  <div className="absolute right-0 top-12 z-[99999]">
                    <EmojiPicker
                      theme="dark"
                      onEmojiClick={(e) => {
                        setPretweet((prev) => prev + e.emoji);
                        setShowEmoji(false);
                      }}
                    />
                  </div>
                )}
              </div>

              <button
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                onClick={() => setSelectPlatformsOpen(true)}
                disabled={disabledUI}
              >
                Select Platforms
              </button>

              <p className="text-sm text-gray-400 mt-2">
                Selected: {platforms.join(", ") || "None"}
              </p>
            </div>
          )}
        </div>

        <button
          className="absolute top-4 right-4 text-xl"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* PLATFORM MODAL */}
      {selectPlatformsOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
          <div className="bg-[#2a2b2f] p-6 rounded-xl w-[350px]">
            <h3 className="text-xl font-bold mb-4">Choose Platforms</h3>

            <label className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                checked={platforms.includes("x")}
                disabled={!connected}
                onChange={() =>
                  connected &&
                  setPlatforms((prev) =>
                    prev.includes("x")
                      ? prev.filter((p) => p !== "x")
                      : [...prev, "x"]
                  )
                }
              />
              <span>X (Twitter)</span>
            </label>

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setSelectPlatformsOpen(false)} className="px-3 py-2 bg-gray-700 rounded">
                Cancel
              </button>
              <button onClick={() => setSelectPlatformsOpen(false)} className="px-3 py-2 bg-blue-600 rounded">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
