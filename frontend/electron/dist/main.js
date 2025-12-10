"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const BACKEND_URL = "http://localhost:8080";
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1100,
        height: 800,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            session: electron_1.session.defaultSession,
        },
    });
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.on("closed", () => (mainWindow = null));
}
electron_1.app.whenReady().then(createWindow);
function notifyTwitterOAuthComplete() {
    console.log("Sending oauth-complete to renderer (TWITTER)");
    mainWindow?.webContents.send("oauth-complete");
}
function notifyTwitchOAuthComplete() {
    console.log("Sending twitch:oauth-complete to renderer");
    mainWindow?.webContents.send("twitch:oauth-complete");
}
// -----------------------------------------------------------
//        Smooth Fade-Out Close (USED BY BOTH SERVICES)
// -----------------------------------------------------------
function smoothClose(win) {
    if (win.isDestroyed())
        return;
    console.log("Closing popup smoothly…");
    win.webContents.on("will-navigate", (e) => e.preventDefault());
    win.webContents.on("will-redirect", (e) => e.preventDefault());
    win.webContents.on("did-start-navigation", (e) => e.preventDefault());
    let opacity = 1;
    const fade = setInterval(() => {
        opacity -= 0.1;
        if (opacity <= 0) {
            clearInterval(fade);
            if (!win.isDestroyed())
                win.destroy();
        }
        else {
            if (!win.isDestroyed())
                win.setOpacity(opacity);
        }
    }, 15);
}
// -----------------------------------------------------------------
// 🎯 🎯  X / TWITTER OAUTH (unchanged from your original code)
// -----------------------------------------------------------------
electron_1.ipcMain.handle("oauth-start", async () => {
    const res = await fetch(`${BACKEND_URL}/api/x/auth/login`);
    const data = await res.json();
    if (!data.url)
        throw new Error("Backend missing OAuth URL");
    let closing = false;
    const popup = new electron_1.BrowserWindow({
        width: 600,
        height: 800,
        parent: mainWindow,
        modal: true,
        webPreferences: {
            nodeIntegration: false,
            session: electron_1.session.defaultSession,
        },
    });
    popup.setOpacity(1);
    popup.loadURL(data.url);
    // -----------------------
    // DOM SCRAPING LOOP
    // -----------------------
    const interval = setInterval(async () => {
        try {
            const result = await popup.webContents.executeJavaScript(`
        (function () {
          const img = document.querySelector("img[src*='pbs.twimg.com/profile_images']");
          if (!img) return null;

          const avatarUrl = img.src;
          let cell = img.closest("[data-testid='UserCell']");
          if (!cell) cell = img.parentElement?.parentElement;
          if (!cell) return { avatarUrl };

          const textNodes = [...cell.querySelectorAll("*")]
            .map(n => n.innerText)
            .filter(Boolean);

          const usernameLine = textNodes.find(t => t.startsWith("@"));
          const username = usernameLine ? usernameLine.replace("@", "") : null;

          let name = null;
          if (usernameLine) {
            const idx = textNodes.indexOf(usernameLine);
            if (idx > 0) name = textNodes[idx - 1];
          }

          return { avatarUrl, username, name };
        })();
      `);
            if (!result)
                return;
            if (result.username && result.name) {
                clearInterval(interval);
                const profile = {
                    username: result.username,
                    name: result.name,
                    profile_image_url: result.avatarUrl,
                };
                console.log("🎉 VALID PROFILE FOUND:", profile);
                mainWindow?.webContents.send("auto-profile", profile);
            }
        }
        catch { }
    }, 400);
    // -------------------------------------------
    // HANDLE REDIRECTS
    // -------------------------------------------
    popup.webContents.on("will-redirect", (_, url) => {
        if (url.includes("error=access_denied") || url.endsWith("/oauth2/authorize")) {
            console.log("❌ User cancelled OAuth (Twitter)");
            clearInterval(interval);
            if (!closing) {
                closing = true;
                smoothClose(popup);
            }
            return;
        }
        if (url.startsWith(`${BACKEND_URL}/api/x/auth/callback`)) {
            console.log("OAuth callback detected (Twitter)");
            clearInterval(interval);
            if (!closing) {
                closing = true;
                smoothClose(popup);
            }
            notifyTwitterOAuthComplete();
        }
    });
    popup.on("closed", async () => {
        clearInterval(interval);
        try {
            const res = await fetch(`${BACKEND_URL}/api/x/auth/status`);
            const status = await res.json();
            if (status.connected)
                notifyTwitterOAuthComplete();
        }
        catch { }
    });
});
// -------------------------------------------------------
// BACKEND PASSTHROUGH FOR TWITTER
// -------------------------------------------------------
electron_1.ipcMain.handle("auth-status", async () => {
    return fetch(`${BACKEND_URL}/api/x/auth/status`).then((r) => r.json());
});
electron_1.ipcMain.handle("profile-get", async () => {
    return fetch(`${BACKEND_URL}/api/x/auth/profile`).then((r) => r.json());
});
electron_1.ipcMain.handle("tweet-post", async (_, text) => {
    return fetch(`${BACKEND_URL}/api/x/auth/tweet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
    }).then((r) => r.json());
});
electron_1.ipcMain.handle("oauth-logout", async () => {
    return fetch(`${BACKEND_URL}/api/x/auth/logout`, {
        method: "POST",
    }).then((r) => r.json());
});
// ==============================================================
// 🟣  FINAL TWITCH OAUTH FLOW (FULL WORKING VERSION)
// ==============================================================
electron_1.ipcMain.handle("twitch:oauth-start", async () => {
    console.log("Starting Twitch OAuth…");
    // 1️⃣ Get Twitch login URL from your Spring Boot backend
    const res = await fetch(`${BACKEND_URL}/api/twitch/auth/login`);
    const data = await res.json();
    if (!data.url) {
        throw new Error("Twitch backend returned no login URL");
    }
    let closing = false;
    // 2️⃣ Create popup window
    const popup = new electron_1.BrowserWindow({
        width: 600,
        height: 800,
        parent: mainWindow,
        modal: true,
        webPreferences: {
            nodeIntegration: false,
            session: electron_1.session.defaultSession,
        },
    });
    // 3️⃣ REQUIRED: Twitch blocks Electron by default — fix by spoofing UA
    popup.webContents.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0 Safari/537.36");
    // 4️⃣ Clear old Twitch cookies (fixes login not appearing)
    await electron_1.session.defaultSession.clearStorageData({
        storages: ["cookies"],
        origin: "https://id.twitch.tv",
    });
    popup.setOpacity(1);
    popup.loadURL(data.url);
    // 5️⃣ Detect successful OAuth callback
    popup.webContents.on("will-redirect", (_, url) => {
        console.log("Twitch redirect:", url);
        // Ignore Twitch's internal redirects — only handle callback
        if (url.startsWith(`${BACKEND_URL}/api/twitch/auth/callback`)) {
            console.log("✔ Twitch OAuth callback detected");
            if (!closing) {
                closing = true;
                smoothClose(popup);
            }
            notifyTwitchOAuthComplete();
        }
    });
    // 6️⃣ Detect manual close:
    // If the backend already has a token, treat it as success.
    popup.on("closed", async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/twitch/auth/status`);
            const status = await res.json();
            if (status.connected) {
                console.log("Popup closed but Twitch token exists → completing login");
                notifyTwitchOAuthComplete();
            }
        }
        catch (err) {
            console.warn("Twitch status check after close failed:", err);
        }
    });
    return { success: true };
});
// -------------------------------------------------------
// TWITCH STATUS
// -------------------------------------------------------
electron_1.ipcMain.handle("twitch:auth-status", async () => {
    return fetch(`${BACKEND_URL}/api/twitch/auth/status`).then((r) => r.json());
});
// -------------------------------------------------------
// TWITCH PROFILE
// -------------------------------------------------------
electron_1.ipcMain.handle("twitch:profile-get", async () => {
    return fetch(`${BACKEND_URL}/api/twitch/auth/profile`).then((r) => r.json());
});
// -------------------------------------------------------
// TWITCH LOGOUT
// -------------------------------------------------------
electron_1.ipcMain.handle("twitch:logout", async () => {
    return fetch(`${BACKEND_URL}/api/twitch/auth/logout`, {
        method: "POST",
    }).then((r) => r.json());
});
// PRETWEET — SAVE (PATCHED)
electron_1.ipcMain.handle("pretweet:save", async (_, data) => {
    const res = await fetch(`${BACKEND_URL}/api/pretweet/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data) // now contains text + platforms
    });
    return await res.json();
});
// PRETWEET — LOAD (PATCHED)
electron_1.ipcMain.handle("pretweet:load", async () => {
    const res = await fetch(`${BACKEND_URL}/api/pretweet/load`);
    return await res.json(); // returns { text, platforms }
});
