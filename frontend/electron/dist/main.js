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
        },
    });
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.on("closed", () => (mainWindow = null));
}
electron_1.app.whenReady().then(createWindow);
// -----------------------------------------------------------------
function notifyOAuthComplete() {
    console.log("Sending oauth-complete to renderer");
    mainWindow?.webContents.send("oauth-complete");
}
// -----------------------------------------------------------------
// START OAUTH
// -----------------------------------------------------------------
electron_1.ipcMain.handle("oauth-start", async () => {
    const res = await fetch(`${BACKEND_URL}/api/x/auth/login`);
    const data = await res.json();
    if (!data.url)
        throw new Error("Backend missing OAuth URL");
    const popup = new electron_1.BrowserWindow({
        width: 600,
        height: 800,
        modal: true,
        parent: mainWindow,
        webPreferences: { nodeIntegration: false }
    });
    popup.loadURL(data.url);
    // 1️⃣ Normal redirect detection
    popup.webContents.on("will-redirect", (_, url) => {
        console.log("Redirect:", url);
        if (url.startsWith(`${BACKEND_URL}/api/x/auth/callback`)) {
            console.log("OAuth success detected from redirect");
            popup.close();
            notifyOAuthComplete();
        }
    });
    // 2️⃣ Backup: popup closed manually → check status
    popup.on("closed", async () => {
        console.log("OAuth popup closed → verifying login state...");
        try {
            const res = await fetch(`${BACKEND_URL}/api/x/auth/status`);
            const status = await res.json();
            if (status.connected) {
                console.log("OAuth verified after close → success");
                notifyOAuthComplete();
            }
            else {
                console.log("OAuth NOT completed after popup closed.");
            }
        }
        catch (err) {
            console.log("Error checking status after closing popup", err);
        }
    });
});
// -----------------------------------------------------------------
// API PASSTHROUGH
// -----------------------------------------------------------------
electron_1.ipcMain.handle("auth-status", async () => {
    const r = await fetch(`${BACKEND_URL}/api/x/auth/status`);
    return await r.json();
});
electron_1.ipcMain.handle("profile-get", async () => {
    const r = await fetch(`${BACKEND_URL}/api/x/auth/profile`);
    return await r.json();
});
electron_1.ipcMain.handle("tweet-post", async (_, text) => {
    const r = await fetch(`${BACKEND_URL}/api/x/auth/tweet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
    });
    return await r.json();
});
electron_1.ipcMain.handle("oauth-logout", async () => {
    const r = await fetch(`${BACKEND_URL}/api/x/auth/logout`, { method: "POST" });
    return await r.json();
});
