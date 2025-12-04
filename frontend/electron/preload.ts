import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  startOAuth: () => ipcRenderer.invoke("oauth-start"),
  getAuthStatus: () => ipcRenderer.invoke("auth-status"),
  postTweet: (text: string) => ipcRenderer.invoke("tweet-post", text),
  logout: () => ipcRenderer.invoke("oauth-logout"),

  onOAuthComplete: (callback: () => void) => {
    ipcRenderer.removeAllListeners("oauth-complete");
    ipcRenderer.on("oauth-complete", () => callback());
  }
});
