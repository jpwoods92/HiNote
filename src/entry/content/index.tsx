import React from "react";
import ReactDOM from "react-dom/client";
import { FloatingHighlighter } from "./FloatingHighlighter";
import "./styles.css";

console.log("HiNote Content Script Loaded");

// 1. Create a container for our React App
const rootEl = document.createElement("div");
rootEl.id = "highlight-note-root";
document.body.appendChild(rootEl);

// 2. Mount the React App into the container
ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <FloatingHighlighter />
  </React.StrictMode>,
);

// 3. HighlightManager is initialized via an import side-effect in FloatingHighlighter.
// This ensures the manager starts listening for events and is ready to restore highlights.
