// src/pages/Login.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import { api, ApiError } from "../lib/api";
import { refreshSessionForPublic } from "../lib/auth";
import { setUserToStorage, setTokenToStorage } from "../lib/storage";
import { Menu, X, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [creds, setCreds] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const mobileFirstLinkRef = useRef(null);

  useEffect(() => {
    (async () => {
      await refreshSessionForPublic({ navigate });
    })();
  }, [navigate]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scroll when mobile menu open & manage focus
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => mobileFirstLinkRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Close mobile menu on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setMobileMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleChange = (e) => {
    setCreds((c) => ({ ...c, [e.target.name]: e.target.value }));
    if (errors[e.target.name] || errors.form) {
      setErrors((err) => ({ ...err, [e.target.name]: "", form: "" }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!creds.email.trim()) errs.email = "Email is required";
    if (!creds.password) errs.password = "Password is required";
    return errs;
  };

  // Local cart helpers (simple localStorage persistence + safety)
  const readLocalCart = () => {
    try {
      const raw = localStorage.getItem("cart");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  const saveLocalCart = (cart) => {
    try {
      if (cart == null) localStorage.removeItem("cart");
      else localStorage.setItem("cart", JSON.stringify(cart));
    } catch (e) {
      // ignore localStorage errors
    }
  };

  // Defensive extractor for different API shapes
  const extractAuthPayload = (res) => {
    const top = res?.data ?? res ?? {};
    const token =
      top?.token ??
      top?.accessToken ??
      top?.data?.token ??
      top?.data?.accessToken ??
      top?.authToken ??
      null;
    const user =
      top?.user ?? top?.data?.user ?? top?.data?.me ?? top?.me ?? top?.profile ?? null;
    return { token, user, raw: top };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await api.post("/auth/login", {
        email: creds.email,
        password: creds.password,
      });

      const { token, user, raw } = extractAuthPayload(res);

      if (!token || !user) {
        setErrors({
          form:
            "Login returned but response missing token or user. Check server response shape in Network tab.",
        });
        setIsLoading(false);
        return;
      }

      // persist token & user
      try {
        setTokenToStorage(token);
        setUserToStorage(user);
      } catch (storeErr) {
        console.error("Storage write failed:", storeErr);
        setErrors({ form: "Failed to save session locally." });
        setIsLoading(false);
        return;
      }

      // Read local cart if any before attempting merge
      const localCart = readLocalCart();

      if (Array.isArray(localCart) && localCart.length > 0) {
        // Best-effort merge: backend may or may not support /cart/merge
        try {
          const mergeRes = await api.post("/cart/merge", { items: localCart });
          const merged = mergeRes?.data ?? mergeRes;
          // write back merged cart if provided
          if (merged?.cart) saveLocalCart(merged.cart);
          else if (merged?.data?.cart) saveLocalCart(merged.data.cart);
          else saveLocalCart(localCart); // fallback keep local cart
        } catch (mergeErr) {
          // merge failed or endpoint absent -> keep local cart
          saveLocalCart(localCart);
        }
      }

      // Dispatch event so CartContext / UI can rehydrate without full reload
      const currentCart = readLocalCart();
      try {
        window.dispatchEvent(
          new CustomEvent("auth:login", { detail: { user: user ?? null, cart: currentCart } })
        );
      } catch {
        window.dispatchEvent(new Event("auth:login"));
      }

      // Robust admin detection:
      const roleString = (user?.role && String(user.role).toLowerCase()) || null;
      const rolesArray = Array.isArray(user?.roles) ? user.roles.map((r) => String(r).toLowerCase()) : [];
      const isAdminFlag = !!user?.is_admin || !!user?.isAdmin || !!user?.admin || !!user?.isAdministrator;

      const isAdmin =
        isAdminFlag ||
        roleString === "admin" ||
        roleString === "administrator" ||
        rolesArray.includes("admin") ||
        rolesArray.includes("administrator");

      // NAVIGATION: use the admin route that you said works (/admin)
      if (isAdmin) {
        navigate("/admin", { replace: true });
      } else if (roleString === "student" || rolesArray.includes("student")) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof ApiError) {
        switch (err.status) {
          case ApiError.Maintenance:
            navigate("/status/maintenance", { replace: true });
            break;
          case ApiError.ServerError:
            navigate("/status/server_error", { replace: true });
            break;
          default:
            setErrors({ form: err.message || "Login failed. Please try again." });
        }
      } else if (err?.response) {
        // axios-like error with response body
        const body = err.response?.data ?? err.response;
        const msg = body?.message || body?.error || "Login failed. See console/network for details.";
        setErrors({ form: msg });
      } else {
        setErrors({ form: "Login failed. Please try again." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* HEADER - JCKL Themed */}
      <header className="w-full bg-white shadow-sm border-b-4 border-jckl-gold sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-2 min-w-0 flex-shrink" aria-label="JCKL Food Reservation Home">
            <img
              src="/jckl-192.png"
              alt="JCKL Academy Logo"
              loading="lazy"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex-shrink-0"
            />
            <div className="font-bold text-jckl-navy min-w-0">
              <span className="hidden xl:inline text-lg">
                Jesus Christ King of Kings and Lord of Lords Academy Inc.
              </span>
              <span className="hidden md:inline xl:hidden text-base truncate max-w-[400px]">
                Jesus Christ King of Kings and Lord of Lords Academy Inc.
              </span>
              <span className="md:hidden text-sm truncate">JCKL Academy</span>
            </div>
          </Link>

          <nav className="hidden lg:flex flex-shrink-0" aria-label="Primary navigation">
            <ul className="flex items-center gap-2 sm:gap-4 lg:gap-8">
              <li>
                <Link
                  to="/"
                  className="text-jckl-slate hover:text-jckl-navy font-medium transition-colors duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-jckl-slate hover:text-jckl-navy font-medium transition-colors duration-200"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-jckl-slate hover:text-jckl-navy font-medium transition-colors duration-200"
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-jckl-navy text-white rounded-lg hover:bg-jckl-light-navy font-medium transition-colors duration-200"
                >
                  Log In
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to="/login" className="hidden sm:inline-block lg:hidden">
              <button className="px-3 py-2 bg-jckl-navy text-white rounded-lg hover:bg-jckl-light-navy font-medium transition-colors duration-200 text-sm">
                Log In
              </button>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen((s) => !s)}
              className="lg:hidden p-2 rounded-lg hover:bg-jckl-cream text-jckl-navy"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="lg:hidden border-t border-jckl-gold bg-white" role="menu" aria-label="Mobile primary navigation">
            <nav className="px-4 py-3 space-y-2">
              <Link
                to="/"
                role="menuitem"
                ref={mobileFirstLinkRef}
                className="block px-3 py-2 text-jckl-slate hover:bg-jckl-cream rounded-lg transition text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/about"
                role="menuitem"
                className="block px-3 py-2 text-jckl-slate hover:bg-jckl-cream rounded-lg transition text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                to="/register"
                role="menuitem"
                className="block px-3 py-2 text-jckl-slate hover:bg-jckl-cream rounded-lg transition text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
              <Link
                to="/login"
                role="menuitem"
                className="block px-3 py-2 bg-jckl-navy text-white hover:bg-jckl-light-navy rounded-lg transition text-sm font-medium sm:hidden"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-grow flex items-center justify-center py-8 sm:py-12 px-4">
        <div className="w-full max-w-md">
          {/* Welcome Card */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src="/jckl-192.png" 
                alt="JCKL Academy Logo" 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-lg" 
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-jckl-navy mb-2">Welcome Back</h1>
            <p className="text-sm sm:text-base text-jckl-slate">Sign in to your food reservation account</p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border-t-4 border-jckl-gold p-6 sm:p-8">
            {errors.form && (
              <div className="mb-6 rounded-lg border border-jckl-accent bg-red-50 px-4 py-3 text-sm text-jckl-accent flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{errors.form}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <Input 
                label="Email Address" 
                name="email" 
                type="email" 
                value={creds.email} 
                onChange={handleChange} 
                placeholder="student@jckl.edu.ph" 
                error={errors.email} 
                autoComplete="username" 
              />
              
              {/* Password field with toggle */}
              <div>
                <div className="relative">
                  <Input 
                    label="Password" 
                    name="password" 
                    type={showPassword ? "text" : "password"}
                    value={creds.password} 
                    onChange={handleChange} 
                    placeholder="••••••••" 
                    error={errors.password} 
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-10 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex="-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="text-right mt-2">
                  <Link 
                    to="/forgot-password" 
                    className="text-xs sm:text-sm text-jckl-navy hover:text-jckl-light-navy hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button type="submit" variant="primary" fullWidth disabled={isLoading} className="bg-jckl-navy hover:bg-jckl-light-navy">
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-xs sm:text-sm text-jckl-slate">
                Don't have an account?{" "}
                <Link to="/register" className="text-jckl-navy hover:text-jckl-light-navy font-semibold">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="py-6 sm:py-8 bg-jckl-navy text-center">
        <div className="text-jckl-cream text-xs sm:text-sm">
          © 2025 JCKL Food Reservation System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}