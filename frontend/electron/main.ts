import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";

const BACKEND_URL = "http://localhost:8080";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL("http://localhost:5173");

  mainWindow.on("closed", () => (mainWindow = null));
}

app.whenReady().then(createWindow);

// -----------------------------------------------------------------

function notifyOAuthComplete() {
  console.log("Sending oauth-complete to renderer");
  mainWindow?.webContents.send("oauth-complete");
}

// -----------------------------------------------------------------
// START OAUTH
// -----------------------------------------------------------------

ipcMain.handle("oauth-start", async () => {
  const res = await fetch(`${BACKEND_URL}/api/x/auth/login`);
  const data = await res.json();

  if (!data.url) throw new Error("Backend missing OAuth URL");

  const popup = new BrowserWindow({
    width: 600,
    height: 800,
    modal: true,
    parent: mainWindow!,
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
      } else {
        console.log("OAuth NOT completed after popup closed.");
      }
    } catch (err) {
      console.log("Error checking status after closing popup", err);
    }
  });
});

// -----------------------------------------------------------------
// API PASSTHROUGH
// -----------------------------------------------------------------

ipcMain.handle("auth-status", async () => {
  const r = await fetch(`${BACKEND_URL}/api/x/auth/status`);
  return await r.json();
});

ipcMain.handle("profile-get", async () => {
  const r = await fetch(`${BACKEND_URL}/api/x/auth/profile`);
  return await r.json();
});

ipcMain.handle("tweet-post", async (_, text: string) => {
  const r = await fetch(`${BACKEND_URL}/api/x/auth/tweet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return await r.json();
});

ipcMain.handle("oauth-logout", async () => {
  const r = await fetch(`${BACKEND_URL}/api/x/auth/logout`, { method: "POST" });
  return await r.json();
});
