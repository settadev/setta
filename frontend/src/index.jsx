import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { subscribe } from "state/subscriptions";
import { pauseTemporal } from "state/utils";
import { globalConstInit } from "utils/constants";
import "../icons.css";
import { App } from "./App";
import "./index.css";
import { reportWebVitals } from "./reportWebVitals";

globalConstInit();
subscribe();
pauseTemporal();

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

reportWebVitals();
