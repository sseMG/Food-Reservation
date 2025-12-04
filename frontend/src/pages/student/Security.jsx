// ...new file...
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/avbar";
import BottomNav from "../../components/mobile/BottomNav";
import { api } from "../../lib/api";
import { refreshSessionForProtected } from "../../lib/auth";
import { getUserFromStorage } from "../../lib/storage";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";

export default function Security() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      await refreshSessionForProtected({ navigate, requiredRole: 'student' });
    })();
  }, [navigate]);

  const localUser = getUserFromStorage() || {};
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState(localUser.email || "");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!userEmail || !userEmail.trim()) {
      setError("Email is required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", {
        email: userEmail.trim()
      });

      setEmailSent(true);
    } catch (err) {
      console.error("Reset password request failed:", err);
      const msg = err.response?.data?.error || err.message || "Failed to send reset email";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-16 md:pb-0">
      <Navbar />
      <main className="max-w-md mx-auto px-3 sm:px-4 py-6 sm:py-12">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {!emailSent ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center text-jckl-navy">
                Change Password
              </h2>
              <p className="text-sm text-jckl-slate text-center mb-6">
                We'll send you a secure link to reset your password
              </p>

              {error && (
                <div className="mb-4 p-3 sm:p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-jckl-navy mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-jckl-slate absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => {
                        setUserEmail(e.target.value);
                        setError("");
                      }}
                      className="w-full border border-jckl-gold rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-jckl-gold focus:border-transparent text-jckl-navy bg-white"
                      placeholder="your@email.com"
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-jckl-slate mt-2">
                    A password reset link will be sent to this email address
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-jckl-cream text-jckl-navy rounded-lg hover:bg-jckl-gold transition-colors font-medium disabled:opacity-60 border border-jckl-gold"
                    disabled={loading}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-jckl-navy text-white rounded-lg hover:bg-jckl-light-navy transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-jckl-navy">
                Check your email!
              </h2>

              <p className="text-sm sm:text-base text-jckl-slate">
                We've sent password reset instructions to
                <span className="block font-semibold text-jckl-navy mt-1 break-all">
                  {userEmail}
                </span>
              </p>

              <div className="bg-jckl-cream border border-jckl-gold rounded-lg p-4 mt-6">
                <p className="text-sm text-jckl-navy">
                  <strong>Next steps:</strong> Check your email for the reset link. The link will expire in 1 hour.
                </p>
              </div>

              <div className="space-y-3 mt-8">
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full px-4 py-3 bg-jckl-navy text-white rounded-lg hover:bg-jckl-light-navy transition-colors font-medium"
                >
                  Back to Profile
                </button>

                <button
                  onClick={() => {
                    setEmailSent(false);
                    setError("");
                    setUserEmail(localUser.email || "");
                  }}
                  className="w-full px-4 py-3 border border-jckl-gold text-jckl-navy rounded-lg hover:bg-jckl-cream transition-colors font-medium"
                >
                  Send to Different Email
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-6">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setError("");
                  }}
                  className="text-jckl-navy hover:text-jckl-light-navy font-medium"
                >
                  try again
                </button>
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
// ...new file...