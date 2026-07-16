import "@fontsource-variable/onest/index.css";
import "@fontsource-variable/unbounded/index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";

import "@/app/styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Fox Dispatcher root element is missing.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
