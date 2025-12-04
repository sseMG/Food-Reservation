import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { refreshSessionForPublic } from "../lib/auth";
import { Clock, Mail, CheckCircle2, Home } from "lucide-react";

export default function RegistrationPending() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "your email";

  useEffect(() => {
    (async () => {
      await refreshSessionForPublic({ navigate });
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
      {/* Logo/Header */}
      <Link to="/" className="mb-8 flex items-center gap-2">
        <img 
          src="/jckl-192.png" 
          alt="JCKL Academy Logo" 
          className="w-12 h-12 rounded-lg"
        />
        <span className="text-xl font-bold text-jckl-navy">JCKL Academy</span>
      </Link>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border-t-4 border-jckl-gold overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-jckl-navy to-jckl-light-navy p-6 sm:p-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-jckl-gold flex items-center justify-center shadow-lg">
              <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-jckl-navy" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">
            Registration Pending
          </h1>
          <p className="text-jckl-cream text-center text-sm mt-2">
            Thank you for registering!
          </p>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Message */}
          <div className="space-y-3">
            <p className="text-jckl-navy text-center">
              Your account has been created successfully and is now pending approval.
            </p>
            <p className="text-jckl-slate text-sm text-center">
              An administrator will review your registration and approve your account shortly.
            </p>
          </div>

          {/* Email Info */}
          <div className="bg-jckl-cream border border-jckl-gold rounded-xl p-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-jckl-navy flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-jckl-navy">Registered Email</p>
              <p className="text-sm text-jckl-slate break-all">{email}</p>
              <p className="text-xs text-jckl-slate mt-1">
                We'll send you a confirmation email when your account is approved.
              </p>
            </div>
          </div>

          {/* What to Expect */}
          <div className="bg-jckl-cream border border-jckl-gold rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-jckl-navy flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-jckl-gold flex-shrink-0" />
              What Happens Next
            </h3>
            <ul className="space-y-2 text-sm text-jckl-navy">
              <li className="flex gap-2">
                <span className="text-jckl-gold font-bold flex-shrink-0">1.</span>
                <span>Admin reviews your registration details</span>
              </li>
              <li className="flex gap-2">
                <span className="text-jckl-gold font-bold flex-shrink-0">2.</span>
                <span>You'll receive an approval email once verified</span>
              </li>
              <li className="flex gap-2">
                <span className="text-jckl-gold font-bold flex-shrink-0">3.</span>
                <span>Log in with your email and password</span>
              </li>
              <li className="flex gap-2">
                <span className="text-jckl-gold font-bold flex-shrink-0">4.</span>
                <span>Start ordering from the canteen!</span>
              </li>
            </ul>
          </div>

          {/* Timeline */}
          <div className="bg-jckl-cream rounded-xl p-4">
            <p className="text-xs font-semibold text-jckl-navy uppercase tracking-wide mb-2">
              Expected Timeline
            </p>
            <p className="text-sm text-jckl-navy">
              <span className="font-medium">⏱️ Usually within 24 hours</span>
            </p>
            <p className="text-xs text-jckl-slate mt-2">
              If you don't receive an email within 24 hours, please contact your school administrator.
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-jckl-gold"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-jckl-navy">Have questions?</span>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-xs text-jckl-slate text-center">
            Contact your school administrator or IT support if you need help.
          </p>
        </div>

        {/* Footer Section */}
        <div className="bg-jckl-cream border-t border-jckl-gold px-6 sm:px-8 py-4">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-jckl-navy to-jckl-light-navy text-white rounded-xl font-semibold hover:from-jckl-light-navy hover:to-jckl-navy transition-all shadow-md hover:shadow-lg"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Footer Text */}
      <p className="mt-8 text-sm text-jckl-slate text-center">
        Already have an approved account?{" "}
        <Link to="/login" className="font-semibold text-jckl-navy hover:text-jckl-light-navy">
          Log in here
        </Link>
      </p>
    </div>
  );
}
