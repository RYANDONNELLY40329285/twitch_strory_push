// =======================
// preload.ts
// =======================

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  // -----------------------------------------
  // TWITTER / X
  // -----------------------------------------
  startOAuth: () => ipcRenderer.invoke("oauth-start"),
  getAuthStatus: () => ipcRenderer.invoke("auth-status"),
  getProfile: () => ipcRenderer.invoke("profile-get"),
  postTweet: (text: string) => ipcRenderer.invoke("tweet-post", text),
  logout: () => ipcRenderer.invoke("oauth-logout"),
  onOAuthComplete: (callback: any) =>
    ipcRenderer.on("oauth-complete", callback),

  // -----------------------------------------
  // AUTO PROFILE (from DOM scraper)
  // -----------------------------------------
  onAutoProfile: (callback: any) =>
    ipcRenderer.on("auto-profile", (_, data) => callback(data)),

  // -----------------------------------------
  // TWITCH
  // -----------------------------------------
  startTwitchOAuth: () => ipcRenderer.invoke("twitch:oauth-start"),
  getTwitchAuthStatus: () => ipcRenderer.invoke("twitch:auth-status"),
  getTwitchProfile: () => ipcRenderer.invoke("twitch:profile-get"),
  logoutTwitch: () => ipcRenderer.invoke("twitch:logout"),
  onTwitchOAuthComplete: (callback: any) =>
    ipcRenderer.on("twitch:oauth-complete", callback),

  // -----------------------------------------
  // PRETWEET STORAGE
  // -----------------------------------------
pretweetSave: (data: { text: string; platforms: string }) =>
  ipcRenderer.invoke("pretweet:save", data),

pretweetLoad: () => ipcRenderer.invoke("pretweet:load"),


});
