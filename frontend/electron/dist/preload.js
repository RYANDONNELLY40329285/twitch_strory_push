"use strict";
// =======================
// preload.ts
// =======================
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("api", {
    exportTweetHistory: () => electron_1.ipcRenderer.invoke("export:tweet-history"),
    // -----------------------------------------
    // TWITTER / X
    // -----------------------------------------
    startOAuth: () => electron_1.ipcRenderer.invoke("oauth-start"),
    getAuthStatus: () => electron_1.ipcRenderer.invoke("auth-status"),
    getProfile: () => electron_1.ipcRenderer.invoke("profile-get"),
    postTweet: (text) => electron_1.ipcRenderer.invoke("tweet-post", text),
    logout: () => electron_1.ipcRenderer.invoke("oauth-logout"),
    onOAuthComplete: (callback) => electron_1.ipcRenderer.on("oauth-complete", callback),
    // -----------------------------------------
    // AUTO PROFILE (from DOM scraper)
    // -----------------------------------------
    onAutoProfile: (callback) => electron_1.ipcRenderer.on("auto-profile", (_, data) => callback(data)),
    // -----------------------------------------
    // TWITCH
    // -----------------------------------------
    startTwitchOAuth: () => electron_1.ipcRenderer.invoke("twitch:oauth-start"),
    getTwitchAuthStatus: () => electron_1.ipcRenderer.invoke("twitch:auth-status"),
    getTwitchProfile: () => electron_1.ipcRenderer.invoke("twitch:profile-get"),
    logoutTwitch: () => electron_1.ipcRenderer.invoke("twitch:logout"),
    onTwitchOAuthComplete: (callback) => electron_1.ipcRenderer.on("twitch:oauth-complete", callback),
    // -----------------------------------------
    // PRETWEET STORAGE
    // -----------------------------------------
    pretweetSave: (data) => electron_1.ipcRenderer.invoke("pretweet:save", data),
    pretweetLoad: () => electron_1.ipcRenderer.invoke("pretweet:load"),
    pretweetSetEnabled: (enabled) => electron_1.ipcRenderer.invoke("pretweet:setEnabled", enabled),
});
