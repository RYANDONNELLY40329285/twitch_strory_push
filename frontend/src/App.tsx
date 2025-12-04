import { useEffect, useState } from "react";

export default function App() {
  const [connected, setConnected] = useState(false);
  const [tweet, setTweet] = useState("");
  const [sending, setSending] = useState(false);

  const MAX_CHARS = 280;

  const refreshStatus = async () => {
    try {
      const res = await window.api.getAuthStatus();
      setConnected(res.connected === true);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle OAuth completion
  useEffect(() => {
    window.api.onOAuthComplete(async () => {
      console.log("OAuth complete → retrying status...");

      // Retry backend for token readiness
      for (let i = 0; i < 15; i++) {
        const res = await window.api.getAuthStatus();
        if (res.connected === true) {
          setConnected(true);
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    });

    refreshStatus();
  }, []);

  const handleLogin = async () => {
    await window.api.startOAuth();
  };

  const handleLogout = async () => {
    await window.api.logout();
    refreshStatus();
  };

  const sendTweet = async () => {
    if (!tweet.trim()) return;

    setSending(true);
    const result = await window.api.postTweet(tweet);
    setSending(false);

    if (result?.result) {
      setTweet(""); // Clear tweet on success
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-xl mx-auto space-y-6">

        <h1 className="text-3xl font-bold text-center">X Desktop Client</h1>

        {/* Connection Status Box (still visible at top) */}
        <div
          className={`p-4 rounded-lg text-center font-semibold ${
            connected ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {connected ? "Connected to X" : "Not Connected"}
        </div>

        {/* Login / Logout */}
        <div className="flex justify-center gap-4">
          {!connected && (
            <button
              onClick={handleLogin}
              className="bg-blue-500 hover:bg-blue-600 px-5 py-2 rounded-lg font-semibold"
            >
              Connect to X
            </button>
          )}

          {connected && (
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg font-semibold"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* Tweet Composer */}
        <div className="bg-gray-800 p-5 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Compose Tweet</h2>

          <textarea
            className="w-full p-3 bg-gray-700 rounded-md text-white outline-none"
            rows={5}
            maxLength={MAX_CHARS}
            placeholder="What's happening?"
            value={tweet}
            onChange={(e) => setTweet(e.target.value)}
          />

          <div className="text-right text-sm text-gray-400 mt-1">
            {tweet.length}/{MAX_CHARS}
          </div>

          <button
            disabled={sending}
            onClick={sendTweet}
            className={`mt-3 w-full py-2 rounded-lg font-semibold ${
              sending
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {sending ? "Sending..." : "Post Tweet"}
          </button>
        </div>
      </div>
    </div>
  );
}
