import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ApiLoadingProvider } from "./context/ApiLoadingContext";
import { ToastProvider } from "./context/ToastContext";
import ApiLoadingBridge from "./components/ApiLoadingBridge";
import GlobalLoading from "./components/GlobalLoading";
import "./index.scss";
import router from "./router";

createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <ToastProvider>
      <ApiLoadingProvider>
        <AuthProvider>
          <ApiLoadingBridge />
          <GlobalLoading />
          <RouterProvider router={router} />
        </AuthProvider>
      </ApiLoadingProvider>
    </ToastProvider>
  </ThemeProvider>,
);
