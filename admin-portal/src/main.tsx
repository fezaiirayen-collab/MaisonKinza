import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AdminPage from "@/pages/AdminPage";
import "@/index.css";

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing");

createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminPage />
    </BrowserRouter>
  </React.StrictMode>,
);
