import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { App as CapacitorApp } from "@capacitor/app";
import App from "./App.jsx";
import "./index.css";

function NativeBackButtonBridge() {
  useEffect(() => {
    let subscription;
    CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      const wasHandled = !window.dispatchEvent(new CustomEvent("clinic:android-back", { cancelable: true }));
      if (wasHandled) return;
      if (canGoBack && window.history.length > 1) {
        window.history.back();
      } else {
        CapacitorApp.exitApp();
      }
    }).then((handle) => {
      subscription = handle;
    });
    return () => {
      subscription?.remove();
    };
  }, []);
  return null;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <NativeBackButtonBridge />
    <App />
  </React.StrictMode>,
);
