import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

contextBridge.exposeInMainWorld("api", {
  startOAuth: () => ipcRenderer.invoke("oauth-start"),
  getAuthStatus: () => ipcRenderer.invoke("auth-status"),
  getProfile: () => ipcRenderer.invoke("profile-get"),
  postTweet: (text: string) => ipcRenderer.invoke("tweet-post", text),
  logout: () => ipcRenderer.invoke("oauth-logout"),

  onOAuthComplete: (cb: () => void) => {
    ipcRenderer.on("oauth-complete", () => cb());
  },

  onAutoProfile: (cb: (profile: any) => void) => {
    ipcRenderer.on("auto-profile", (_: IpcRendererEvent, profile: any) => {
      cb(profile);
    });
  },
});
