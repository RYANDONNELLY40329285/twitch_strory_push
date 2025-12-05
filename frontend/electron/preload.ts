import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

contextBridge.exposeInMainWorld("api", {
  // OAuth start
  startOAuth: async (): Promise<any> => {
    return await ipcRenderer.invoke("oauth-start");
  },

  // Logout
  logout: async (): Promise<any> => {
    return await ipcRenderer.invoke("oauth-logout");
  },

  // Backend status
  getAuthStatus: async (): Promise<any> => {
    return await ipcRenderer.invoke("auth-status");
  },

  // Profile
  getProfile: async (): Promise<any> => {
    return await ipcRenderer.invoke("profile-get");
  },

  // Tweet posting
  postTweet: async (text: string): Promise<any> => {
    return await ipcRenderer.invoke("tweet-post", text);
  },

  // OAuth finished
  onOAuthComplete: (cb: () => void): void => {
    ipcRenderer.on("oauth-complete", () => cb());
  },

  // Auto-profile from popup
  onAutoProfile: (cb: (profile: any) => void): void => {
    ipcRenderer.on(
      "auto-profile",
      (_event: IpcRendererEvent, profile: any) => cb(profile)
    );
  },
});
