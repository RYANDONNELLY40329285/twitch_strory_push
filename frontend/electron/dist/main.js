"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const BACKEND_URL = "http://localhost:8080";
let mainWindow = null;
// -----------------------------------------------------
// Create main window
// -----------------------------------------------------
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
// -----------------------------------------------------
// Notify renderer OAuth is completed
// -----------------------------------------------------
function notifyOAuthComplete() {
    console.log("Sending oauth-complete to renderer");
    mainWindow?.webContents.send("oauth-complete");
}
// -----------------------------------------------------
// START OAUTH POPUP
// -----------------------------------------------------
electron_1.ipcMain.handle("oauth-start", async () => {
    const res = await fetch(`${BACKEND_URL}/api/x/auth/login`);
    const data = await res.json();
    if (!data.url)
        throw new Error("Backend missing OAuth URL");
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
    popup.loadURL(data.url);
    // -----------------------------------------------------
    // POLL DOM UNTIL USER CELL APPEARS
    // -----------------------------------------------------
    const interval = setInterval(async () => {
        try {
            const result = await popup.webContents.executeJavaScript(`
        (function () {
          const img = document.querySelector("img[src*='pbs.twimg.com/profile_images']");
          if (!img) return null;

          const avatarUrl = img.src;

          // Find container holding name + username
          let cell = img.closest("[data-testid='UserCell']");
          if (!cell) cell = img.parentElement?.parentElement;
          if (!cell) return { avatarUrl };

          const textNodes = [...cell.querySelectorAll("*")]
            .map(n => n.innerText)
            .filter(Boolean);

          // Find username line
          const usernameLine = textNodes.find(t => t.startsWith("@"));
          const username = usernameLine ? usernameLine.replace("@", "") : null;

          // Correct display name -> line directly above @username
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
            console.log("🔥 DOM SCRAPE RESULT:", result);
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
        catch (err) {
            console.log("DOM parse error:", err);
        }
    }, 400);
    // -----------------------------------------------------
    // When popup redirects to backend
    // -----------------------------------------------------
    popup.webContents.on("will-redirect", (_, url) => {
        if (url.startsWith(`${BACKEND_URL}/api/x/auth/callback`)) {
            console.log("Callback redirect detected.");
            clearInterval(interval);
            popup.close();
            notifyOAuthComplete();
        }
    });
    popup.on("closed", async () => {
        clearInterval(interval);
        try {
            const res = await fetch(`${BACKEND_URL}/api/x/auth/status`);
            const status = await res.json();
            if (status.connected)
                notifyOAuthComplete();
        }
        catch (err) {
            console.log("Error checking status:", err);
        }
    });
});
// -----------------------------------------------------
// BACKEND API PASSTHROUGH
// -----------------------------------------------------
electron_1.ipcMain.handle("auth-status", async () => {
    return await fetch(`${BACKEND_URL}/api/x/auth/status`).then(r => r.json());
});
electron_1.ipcMain.handle("profile-get", async () => {
    return await fetch(`${BACKEND_URL}/api/x/auth/profile`).then(r => r.json());
});
electron_1.ipcMain.handle("tweet-post", async (_, text) => {
    return await fetch(`${BACKEND_URL}/api/x/auth/tweet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
    }).then(r => r.json());
});
electron_1.ipcMain.handle("oauth-logout", async () => {
    return await fetch(`${BACKEND_URL}/api/x/auth/logout`, {
        method: "POST",
    }).then(r => r.json());
});
