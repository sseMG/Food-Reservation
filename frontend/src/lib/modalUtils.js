// src/lib/modalUtils.js
// Utility to access modal functions outside of React components

let modalContext = null;

export function setModalContext(context) {
  modalContext = context;
}

export async function showAlert(message, type = "info", title = "") {
  if (!modalContext) {
    // Fallback to native alert if context not available
    window.alert(message);
    return;
  }
  return modalContext.showAlert(message, type, title);
}

export async function showConfirm(message, title = "Confirm Action") {
  if (!modalContext) {
    // Fallback to native confirm if context not available
    return window.confirm(message);
  }
  return modalContext.showConfirm(message, title);
}
