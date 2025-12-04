import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  startOAuth: () => ipcRenderer.invoke("oauth-start"),
  getAuthStatus: () => ipcRenderer.invoke("auth-status"),
  getProfile: () => ipcRenderer.invoke("profile-get"),
  postTweet: (text: string) => ipcRenderer.invoke("tweet-post", text),
  logout: () => ipcRenderer.invoke("oauth-logout"),

  onOAuthComplete: (callback: () => void) => {
    ipcRenderer.removeAllListeners("oauth-complete");
    ipcRenderer.on("oauth-complete", () => {
      console.log("Renderer received oauth-complete");
      callback();
    });
  }
});
