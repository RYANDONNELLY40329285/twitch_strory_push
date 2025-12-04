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
        width: 900,
        height: 700,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(createWindow);
// START OAUTH
electron_1.ipcMain.handle("oauth-start", async () => {
    console.log("OAuth → Requesting login URL...");
    const res = await fetch(`${BACKEND_URL}/api/x/auth/login`);
    const data = await res.json();
    if (!data.url)
        throw new Error("Backend did not return url");
    const popup = new electron_1.BrowserWindow({
        width: 600,
        height: 800,
        parent: mainWindow,
        modal: true,
        webPreferences: { nodeIntegration: false }
    });
    popup.loadURL(data.url);
    popup.webContents.on("will-redirect", (_, url) => {
        if (url.startsWith(`${BACKEND_URL}/api/x/auth/callback`)) {
            console.log("OAuth redirect callback detected");
            popup.close();
            mainWindow?.webContents.send("oauth-complete");
        }
    });
    // EXTRA FIX: also trigger when popup closes manually
    popup.on("closed", () => {
        console.log("Popup closed → renderer should refresh auth state");
        mainWindow?.webContents.send("oauth-complete");
    });
});
// GET STATUS
electron_1.ipcMain.handle("auth-status", async () => {
    const res = await fetch(`${BACKEND_URL}/api/x/auth/status`);
    return await res.json();
});
// POST TWEET
electron_1.ipcMain.handle("tweet-post", async (_, text) => {
    const res = await fetch(`${BACKEND_URL}/api/x/auth/tweet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
    });
    return await res.json();
});
// LOGOUT
electron_1.ipcMain.handle("oauth-logout", async () => {
    const res = await fetch(`${BACKEND_URL}/api/x/auth/logout`, { method: "POST" });
    return await res.json();
});
electron_1.app.on("window-all-closed", () => electron_1.app.quit());
