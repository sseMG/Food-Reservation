import React, { useState } from "react";
import { Link } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import { api } from "../lib/api";
import { Menu, X } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="w-full bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg line-clamp-2">
            Jesus Christ King of Kings and Lord of Lords Academy Inc.
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center space-x-4 lg:space-x-8 flex-shrink-0 ml-4">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 whitespace-nowrap"
            >
              Home
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 whitespace-nowrap text-sm"
            >
              Log In
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-2">
              <Link
                to="/"
                className="block px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/login"
                className="block w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200 text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* FORM */}
      <div className="py-8 sm:py-12 px-4">
        <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Forgot Password?</h1>
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <p className="font-medium mb-1">Check your email!</p>
                <p>
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
              </div>
              <Link
                to="/login"
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="your.email@example.com"
                autoComplete="email"
              />

              <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Remember your password?{" "}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
