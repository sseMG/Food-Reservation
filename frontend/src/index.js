import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { CartProvider } from "./contexts/CartContext";
import { ModalProvider } from "./contexts/ModalContext";

// Suppress ResizeObserver loop error (non-critical browser notification issue)
const errorHandler = window.addEventListener('error', (event) => {
  if (event.message === 'ResizeObserver loop completed with undelivered notifications.') {
    event.preventDefault();
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10000,
      cacheTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      suspense: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

const root = createRoot(document.getElementById("root"));

// icons are frontend-only; no server fetch required

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ModalProvider>
        <CartProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        </CartProvider>
      </ModalProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
