// src/contexts/ModalContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import CustomModal from "../components/CustomModal";
import { setModalContext } from "../lib/modalUtils";

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export function ModalProvider({ children }) {
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
    confirmText: "OK",
    cancelText: "Cancel",
    showCancel: false,
  });

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  /**
   * Show an alert dialog (replaces window.alert)
   * @param {string} message - The message to display
   * @param {string} type - 'info', 'success', 'warning'
   * @param {string} title - Optional title
   */
  const showAlert = useCallback((message, type = "info", title = "") => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        title: title || (type === "success" ? "Success" : type === "warning" ? "Warning" : "Notice"),
        message,
        type,
        onConfirm: resolve,
        confirmText: "OK",
        showCancel: false,
      });
    });
  }, []);

  /**
   * Show a confirmation dialog (replaces window.confirm)
   * @param {string} message - The message to display
   * @param {string} title - Optional title
   * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
   */
  const showConfirm = useCallback((message, title = "Confirm Action") => {
    return new Promise((resolve) => {
      setModal({
        isOpen: true,
        title,
        message,
        type: "confirm",
        onConfirm: resolve, // Pass resolve directly so we can call resolve(true) or resolve(false)
        confirmText: "OK",
        cancelText: "Cancel",
        showCancel: true,
      });
    });
  }, []);

  const value = {
    showAlert,
    showConfirm,
  };

  // Register modal functions globally for non-React contexts
  useEffect(() => {
    setModalContext(value);
  }, [value]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      <CustomModal
        isOpen={modal.isOpen}
        onClose={() => {
          if (modal.showCancel) {
            // Confirmation was cancelled
            if (modal.onConfirm) modal.onConfirm(false);
          }
          closeModal();
        }}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={() => {
          if (modal.onConfirm) modal.onConfirm(true);
          closeModal();
        }}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        showCancel={modal.showCancel}
      />
    </ModalContext.Provider>
  );
}
