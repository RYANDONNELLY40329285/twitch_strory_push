import { app, BrowserWindow, ipcMain, session } from "electron";
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
      session: session.defaultSession,
    },
  });

  mainWindow.loadURL("http://localhost:5173");
  mainWindow.on("closed", () => (mainWindow = null));
}

app.whenReady().then(createWindow);

function notifyOAuthComplete() {
  console.log("Sending oauth-complete to renderer");
  mainWindow?.webContents.send("oauth-complete");
}

// -----------------------------------------------
//  Smooth Fade-Out Close (prevents flicker)
// -----------------------------------------------
function smoothClose(win: BrowserWindow) {
  if (win.isDestroyed()) return;

  console.log("Closing popup smoothly…");

  // BLOCK ALL NAVIGATION instantly (fixes flicker)
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.webContents.on("will-redirect", (e) => e.preventDefault());
  win.webContents.on("did-start-navigation", (e) => e.preventDefault());

  let opacity = 1;
  const fade = setInterval(() => {
    opacity -= 0.1;

    if (opacity <= 0) {
      clearInterval(fade);
      if (!win.isDestroyed()) win.destroy();
    } else {
      if (!win.isDestroyed()) win.setOpacity(opacity);
    }
  }, 15);
}

// -----------------------------------------------
// START OAUTH POPUP
// -----------------------------------------------
ipcMain.handle("oauth-start", async () => {
  const res = await fetch(`${BACKEND_URL}/api/x/auth/login`);
  const data = await res.json();

  if (!data.url) throw new Error("Backend missing OAuth URL");

  let closing = false;

  const popup = new BrowserWindow({
    width: 600,
    height: 800,
    parent: mainWindow!,
    modal: true,
    webPreferences: {
      nodeIntegration: false,
      session: session.defaultSession,
    },
  });

  popup.setOpacity(1);
  popup.loadURL(data.url);

  // -------------------------------------------
  // DOM SCRAPING LOOP
  // -------------------------------------------
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

      if (!result) return;

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
    } catch {}
  }, 400);

  // -------------------------------------------
  // HANDLE REDIRECTS
  // -------------------------------------------
  popup.webContents.on("will-redirect", (_, url) => {

    // 🔥 User pressed CANCEL
    if (url.includes("error=access_denied") || url.endsWith("/oauth2/authorize")) {
      console.log("❌ User cancelled OAuth");
      clearInterval(interval);
      if (!closing) {
        closing = true;
        smoothClose(popup);
      }
      return;
    }

    // ✔ OAuth completed
    if (url.startsWith(`${BACKEND_URL}/api/x/auth/callback`)) {
      console.log("OAuth callback detected");
      clearInterval(interval);
      if (!closing) {
        closing = true;
        smoothClose(popup);
      }
      notifyOAuthComplete();
    }
  });

  // -------------------------------------------
  // WINDOW MANUALLY CLOSED (X button)
  // -------------------------------------------
  popup.on("closed", async () => {
    clearInterval(interval);

    try {
      const res = await fetch(`${BACKEND_URL}/api/x/auth/status`);
      const status = await res.json();
      if (status.connected) notifyOAuthComplete();
    } catch {}
  });
});

// -----------------------------------------------
// BACKEND API PASSTHROUGH
// -----------------------------------------------
ipcMain.handle("auth-status", async () => {
  return fetch(`${BACKEND_URL}/api/x/auth/status`).then((r) => r.json());
});

ipcMain.handle("profile-get", async () => {
  return fetch(`${BACKEND_URL}/api/x/auth/profile`).then((r) => r.json());
});

ipcMain.handle("tweet-post", async (_, text: string) => {
  return fetch(`${BACKEND_URL}/api/x/auth/tweet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }).then((r) => r.json());
});

ipcMain.handle("oauth-logout", async () => {
  return fetch(`${BACKEND_URL}/api/x/auth/logout`, {
    method: "POST",
  }).then((r) => r.json());
});
