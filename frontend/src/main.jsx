import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { RetailerProvider } from "./context/RetailerContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <RetailerProvider>
        <App />
      </RetailerProvider>
    </AuthProvider>
  </BrowserRouter>
);