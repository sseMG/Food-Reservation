// src/components/CustomModal.jsx
import React, { useEffect } from "react";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";

/**
 * Custom Modal Component for alerts and confirmations
 * Replaces browser's default alert() and confirm()
 */
export default function CustomModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info", // 'info', 'success', 'warning', 'confirm'
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = false,
}) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-12 h-12 text-amber-600" />;
      case "confirm":
        return <AlertTriangle className="w-12 h-12 text-blue-600" />;
      default:
        return <Info className="w-12 h-12 text-blue-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50";
      case "warning":
        return "bg-amber-50";
      case "confirm":
        return "bg-blue-50";
      default:
        return "bg-blue-50";
    }
  };

  const handleConfirm = () => {
    // Call onConfirm which will handle the resolution and closing
    if (onConfirm) onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideUp">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${getBackgroundColor()} flex items-center justify-center`}>
            {getIcon()}
          </div>

          {/* Title */}
          {title && (
            <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
              {title}
            </h3>
          )}

          {/* Message */}
          <p className="text-gray-600 text-center leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <div className={`flex gap-3 ${showCancel ? 'flex-row-reverse' : ''}`}>
            {showCancel && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium text-white transition ${
                type === "warning" || type === "confirm"
                  ? "bg-jckl-navy hover:bg-jckl-light-navy"
                  : "bg-jckl-navy hover:bg-jckl-light-navy"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
