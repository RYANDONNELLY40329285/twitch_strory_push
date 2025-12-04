import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";

const BACKEND_URL = "http://localhost:8080";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL("http://localhost:5173");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

// START OAUTH
ipcMain.handle("oauth-start", async () => {
  console.log("OAuth → Requesting login URL...");

  const res = await fetch(`${BACKEND_URL}/api/x/auth/login`);
  const data = await res.json();

  if (!data.url) throw new Error("Backend did not return url");

  const popup = new BrowserWindow({
    width: 600,
    height: 800,
    parent: mainWindow!,
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
ipcMain.handle("auth-status", async () => {
  const res = await fetch(`${BACKEND_URL}/api/x/auth/status`);
  return await res.json();
});

// POST TWEET
ipcMain.handle("tweet-post", async (_, text: string) => {
  const res = await fetch(`${BACKEND_URL}/api/x/auth/tweet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  return await res.json();
});

// LOGOUT
ipcMain.handle("oauth-logout", async () => {
  const res = await fetch(`${BACKEND_URL}/api/x/auth/logout`, { method: "POST" });
  return await res.json();
});

app.on("window-all-closed", () => app.quit());
