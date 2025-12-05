"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("api", {
    startOAuth: () => electron_1.ipcRenderer.invoke("oauth-start"),
    getAuthStatus: () => electron_1.ipcRenderer.invoke("auth-status"),
    getProfile: () => electron_1.ipcRenderer.invoke("profile-get"),
    postTweet: (text) => electron_1.ipcRenderer.invoke("tweet-post", text),
    logout: () => electron_1.ipcRenderer.invoke("oauth-logout"),
    onOAuthComplete: (cb) => {
        electron_1.ipcRenderer.on("oauth-complete", () => cb());
    },
    onAutoProfile: (cb) => {
        electron_1.ipcRenderer.on("auto-profile", (_, profile) => {
            cb(profile);
        });
    },
});
